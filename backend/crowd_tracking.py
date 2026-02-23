"""
Enhanced Crowd Detection System with YOLO11 & ByteTrack
Tracks persons with unique IDs across frames for stable counting
Includes track persistence, grace period, and exit zone detection
Using YOLO11x for superior crowd detection accuracy
"""
import cv2
import torch
from ultralytics import YOLO
from pathlib import Path
import time
import numpy as np
from collections import defaultdict
from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass
class TrackState:
    """State information for a tracked person"""
    track_id: int
    last_seen_frame: int
    last_position: Tuple[int, int, int, int]  # x1, y1, x2, y2
    first_seen_frame: int
    is_active: bool = True
    frames_missing: int = 0
    exited: bool = False


class CrowdTracker:
    def __init__(
        self,
        model_name="yolo11x.pt",
        confidence_threshold=0.15,  # Very low for partially visible people in buses
        target_size=1280,  # Larger size for better small object detection
        device=None,
        grace_period_frames=45,  # Longer grace for bus movement/occlusion
        grace_period_seconds=3.0,  # 3 seconds grace period for buses
        exit_zone=None  # Optional: (x1, y1, x2, y2) for exit detection
    ):
        """
        Initialize the crowd tracking system with YOLO11 and stable occupancy
        Optimized for bus occupancy detection with partial visibility handling
        
        Args:
            model_name: YOLO11 model variant (yolo11x recommended for buses)
            confidence_threshold: Very low (0.15) to catch partially visible people
            target_size: Large size (1280) for better detection of distant passengers
            device: 'cuda' or 'cpu', auto-detected if None
            grace_period_frames: Keep lost tracks alive (45 frames for bus motion)
            grace_period_seconds: Alternative time-based grace period (3s for buses)
            exit_zone: Optional tuple (x1, y1, x2, y2) defining exit/door area
        """
        self.confidence_threshold = confidence_threshold
        self.target_size = target_size
        self.grace_period_frames = grace_period_frames
        self.grace_period_seconds = grace_period_seconds
        self.exit_zone = exit_zone
        
        # Auto-detect device
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device
            
        print(f"Using device: {self.device}")
        if self.device == 'cuda':
            print(f"GPU: {torch.cuda.get_device_name(0)}")
        
        # Load YOLOv8 model with tracking
        print(f"Loading {model_name} with ByteTrack...")
        self.model = YOLO(model_name)
        self.model.to(self.device)
        print("Model loaded successfully!")
        
        # COCO dataset person class ID
        self.person_class_id = 0
        
        # Color palette for tracking IDs
        np.random.seed(42)
        self.colors = {}
        
        # Track management for stable occupancy
        self.tracks: dict[int, TrackState] = {}
        self.current_frame = 0
        self.video_fps = 30  # Will be updated from video
        
        print(f"Occupancy settings (Bus Optimized):")
        print(f"  Grace period: {grace_period_frames} frames (~{grace_period_seconds}s)")
        print(f"  Inference size: {target_size} (larger = better small object detection)")
        print(f"  Confidence: {confidence_threshold} (low for partial visibility)")
        if exit_zone:
            print(f"  Exit zone: {exit_zone}")
        
    def get_color_for_id(self, track_id):
        """Get consistent color for each tracking ID"""
        if track_id not in self.colors:
            # Generate random but consistent color for this ID
            self.colors[track_id] = tuple(np.random.randint(100, 255, 3).tolist())
        return self.colors[track_id]
        
    def process_video(
        self,
        input_path,
        output_path="crowd_tracking_output.mp4",
        display=True,
        save_output=True
    ):
        """
        Process video file for crowd tracking
        
        Args:
            input_path: Path to input video
            output_path: Path to save output video
            display: Show real-time processing
            save_output: Save processed video
        """
        # Open video
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {input_path}")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Update FPS for grace period calculations
        self.video_fps = fps if fps > 0 else 30
        # Recalculate grace period in frames based on time
        self.grace_period_frames = max(
            self.grace_period_frames,
            int(self.grace_period_seconds * self.video_fps)
        )
        
        print(f"\nVideo Info:")
        print(f"  Resolution: {width}x{height}")
        print(f"  FPS: {fps}")
        print(f"  Total Frames: {total_frames}")
        print(f"  Duration: {total_frames/fps:.2f}s")
        print(f"  Adjusted grace period: {self.grace_period_frames} frames\n")
        
        # Setup video writer with browser-compatible codec
        writer = None
        if save_output:
            # Try multiple codecs for browser compatibility
            codecs_to_try = [
                ('avc1', 'H.264/AVC'),  # Best for browsers
                ('H264', 'H.264'),       # Alternative H.264
                ('X264', 'x264'),        # Another H.264 variant
                ('mp4v', 'MPEG-4')       # Fallback (may not work in all browsers)
            ]
            
            for codec, codec_name in codecs_to_try:
                try:
                    fourcc = cv2.VideoWriter_fourcc(*codec)
                    test_writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                    if test_writer.isOpened():
                        writer = test_writer
                        print(f"✓ Using codec: {codec_name} ({codec})")
                        break
                    else:
                        test_writer.release()
                except Exception as e:
                    continue
            
            if writer is None or not writer.isOpened():
                raise RuntimeError(
                    "Failed to initialize video writer with browser-compatible codec. "
                    "Please ensure H.264 codec is available on your system."
                )
        
        frame_count = 0
        start_time = time.time()
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                self.current_frame = frame_count
                
                # Run tracking with stable occupancy
                processed_frame, instant_tracks, stable_count = self._track_persons(frame)
                
                # Calculate FPS
                elapsed = time.time() - start_time
                current_fps = frame_count / elapsed if elapsed > 0 else 0
                
                # Add info overlay with stable count
                self._add_overlay(
                    processed_frame,
                    instant_tracks,
                    stable_count,
                    current_fps,
                    frame_count,
                    total_frames
                )
                
                # Display
                if display:
                    cv2.imshow('Crowd Tracking', processed_frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        print("\nStopped by user")
                        break
                
                # Save
                if writer:
                    writer.write(processed_frame)
                
                # Progress
                if frame_count % 30 == 0:
                    progress = (frame_count / total_frames) * 100
                    print(f"Progress: {progress:.1f}% | "
                          f"Frame: {frame_count}/{total_frames} | "
                          f"FPS: {current_fps:.1f} | "
                          f"Instant: {instant_tracks} | Stable: {stable_count}")
        
        finally:
            cap.release()
            if writer:
                writer.release()
            if display:
                cv2.destroyAllWindows()
        
        # Summary
        elapsed = time.time() - start_time
        print(f"\n{'='*50}")
        print(f"Processing Complete!")
        print(f"  Frames Processed: {frame_count}")
        print(f"  Time Taken: {elapsed:.2f}s")
        print(f"  Average FPS: {frame_count/elapsed:.2f}")
        if save_output:
            print(f"  Output Saved: {output_path}")
        print(f"{'='*50}\n")
    
    def _track_persons(self, frame):
        """
        Track persons with stable occupancy counting
        
        Args:
            frame: Input frame (BGR)
            
        Returns:
            processed_frame: Frame with tracking boxes
            instant_tracks: Number of currently detected tracks
            stable_count: Stable occupancy count with grace period
        """
        # Run tracking with ByteTrack - optimized for bus scenarios
        results = self.model.track(
            frame,
            imgsz=self.target_size,
            conf=self.confidence_threshold,
            iou=0.4,  # Lower IOU for better overlapping/occluded detection
            classes=[self.person_class_id],
            persist=True,
            tracker='bytetrack.yaml',  # Use default ByteTrack configuration
            verbose=False,
            max_det=300,  # High limit for crowded buses
            agnostic_nms=True,  # Better NMS for crowds
            half=True if self.device == 'cuda' else False,  # FP16 for speed on GPU
        )
        
        result = results[0]
        boxes = result.boxes
        
        # Track IDs seen in this frame
        seen_ids = set()
        instant_tracks = 0
        
        # Process current detections
        if boxes is not None and boxes.id is not None:
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                track_id = int(box.id[0]) if box.id is not None else -1
                
                if track_id != -1:
                    instant_tracks += 1
                    seen_ids.add(track_id)
                    
                    # Update or create track state
                    if track_id not in self.tracks:
                        self.tracks[track_id] = TrackState(
                            track_id=track_id,
                            last_seen_frame=self.current_frame,
                            last_position=(x1, y1, x2, y2),
                            first_seen_frame=self.current_frame,
                            is_active=True,
                            frames_missing=0
                        )
                    else:
                        # Update existing track
                        track = self.tracks[track_id]
                        track.last_seen_frame = self.current_frame
                        track.last_position = (x1, y1, x2, y2)
                        track.frames_missing = 0
                        track.is_active = True
                    
                    # Check if in exit zone
                    if self.exit_zone and self._in_exit_zone(x1, y1, x2, y2):
                        self.tracks[track_id].exited = True
                    
                    # Get color for this ID
                    color = self.get_color_for_id(track_id)
                    
                    # Determine if track is stable (not in grace period)
                    is_stable = track_id in self.tracks and not self.tracks[track_id].exited
                    
                    # Draw box - different style for stable vs unstable
                    thickness = 3 if is_stable else 2
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
                    
                    # Prepare label
                    label = f"ID:{track_id} {confidence:.2f}"
                    label_size, _ = cv2.getTextSize(
                        label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
                    )
                    
                    # Draw label background
                    cv2.rectangle(
                        frame,
                        (x1, y1 - label_size[1] - 10),
                        (x1 + label_size[0] + 10, y1),
                        color, -1
                    )
                    
                    # Draw label text
                    cv2.putText(
                        frame, label, (x1 + 5, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                        (255, 255, 255), 2
                    )
        
        # Update tracks not seen in this frame
        tracks_to_remove = []
        for track_id, track in self.tracks.items():
            if track_id not in seen_ids:
                track.frames_missing += 1
                
                # Check if grace period expired or exited
                frames_since_last_seen = self.current_frame - track.last_seen_frame
                
                if track.exited or frames_since_last_seen > self.grace_period_frames:
                    track.is_active = False
                    tracks_to_remove.append(track_id)
                else:
                    # Still in grace period - draw ghosted box
                    x1, y1, x2, y2 = track.last_position
                    color = self.get_color_for_id(track_id)
                    ghosted_color = tuple(int(c * 0.5) for c in color)
                    
                    cv2.rectangle(frame, (x1, y1), (x2, y2), ghosted_color, 1, cv2.LINE_AA)
                    
                    # Draw ghost label
                    label = f"ID:{track_id} (lost {track.frames_missing}f)"
                    cv2.putText(
                        frame, label, (x1 + 5, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                        ghosted_color, 1
                    )
        
        # Remove expired tracks
        for track_id in tracks_to_remove:
            del self.tracks[track_id]
            if track_id in self.colors:
                del self.colors[track_id]
        
        # Calculate stable count (active tracks including grace period)
        stable_count = sum(1 for t in self.tracks.values() if not t.exited)
        
        # Draw exit zone if defined
        if self.exit_zone:
            x1, y1, x2, y2 = self.exit_zone
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(
                frame, "EXIT ZONE", (x1 + 5, y1 + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2
            )
        
        return frame, instant_tracks, stable_count
    
    def _in_exit_zone(self, x1, y1, x2, y2):
        """Check if bounding box center is in exit zone"""
        if not self.exit_zone:
            return False
        
        # Calculate center of bounding box
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        
        # Check if center is in exit zone
        ex1, ey1, ex2, ey2 = self.exit_zone
        return ex1 <= cx <= ex2 and ey1 <= cy <= ey2
    
    def _add_overlay(self, frame, instant_tracks, stable_count, fps, current_frame, total_frames):
        """Add information overlay to frame with stable occupancy count"""
        height, width = frame.shape[:2]
        
        # Semi-transparent background for bottom text
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, height - 100), (width, height), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        # Stable occupancy count (large, centered)
        count_text = f"Occupancy: {stable_count}"
        font_scale = 1.8
        thickness = 3
        text_size, _ = cv2.getTextSize(
            count_text,
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale,
            thickness
        )
        text_x = (width - text_size[0]) // 2
        text_y = height - 50
        
        # Draw stable count with outline
        cv2.putText(
            frame, count_text, (text_x, text_y),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale,
            (0, 255, 255), thickness + 2
        )
        cv2.putText(
            frame, count_text, (text_x, text_y),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale,
            (0, 200, 255), thickness
        )
        
        # Instant count (smaller, below)
        instant_text = f"(Instant: {instant_tracks})"
        instant_size, _ = cv2.getTextSize(
            instant_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2
        )
        instant_x = (width - instant_size[0]) // 2
        cv2.putText(
            frame, instant_text, (instant_x, height - 15),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7,
            (200, 200, 200), 2
        )
        
        # FPS and progress (top left)
        info_text = f"FPS: {fps:.1f} | Frame: {current_frame}/{total_frames}"
        cv2.rectangle(frame, (0, 0), (450, 40), (0, 0, 0), -1)
        cv2.putText(
            frame, info_text, (10, 25),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6,
            (255, 255, 255), 2
        )
        
        # Tracking info (top right) - show both counts
        track_text = f"Stable: {stable_count} | Grace: {self.grace_period_frames}f"
        track_size, _ = cv2.getTextSize(
            track_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
        )
        cv2.rectangle(
            frame,
            (width - track_size[0] - 20, 0),
            (width, 40),
            (0, 0, 0), -1
        )
        cv2.putText(
            frame, track_text,
            (width - track_size[0] - 10, 25),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6,
            (0, 255, 0), 2
        )


def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Crowd Tracking with ByteTrack')
    parser.add_argument(
        '--input',
        type=str,
        required=True,
        help='Path to input video file'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='crowd_tracking_output.mp4',
        help='Path to output video file (default: crowd_tracking_output.mp4)'
    )
    parser.add_argument(
        '--confidence',
        type=float,
        default=0.4,
        help='Confidence threshold (default: 0.4)'
    )
    parser.add_argument(
        '--size',
        type=int,
        default=640,
        help='Inference size (default: 640, can use 800 for better accuracy)'
    )
    parser.add_argument(
        '--no-display',
        action='store_true',
        help='Disable real-time display'
    )
    parser.add_argument(
        '--no-save',
        action='store_true',
        help='Disable output video saving'
    )
    
    args = parser.parse_args()
    
    # Validate input
    if not Path(args.input).exists():
        print(f"Error: Input file not found: {args.input}")
        return
    
    # Initialize tracker
    tracker = CrowdTracker(
        confidence_threshold=args.confidence,
        target_size=args.size
    )
    
    # Process video
    tracker.process_video(
        input_path=args.input,
        output_path=args.output,
        display=not args.no_display,
        save_output=not args.no_save
    )


if __name__ == "__main__":
    main()
