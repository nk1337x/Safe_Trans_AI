"""
Flask API for Crowd Detection System
Clean implementation with all required endpoints
"""
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pathlib import Path
import threading
import uuid
import os
from crowd_tracking import CrowdTracker

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Range"],
        "expose_headers": ["Content-Range", "Accept-Ranges", "Content-Length"]
    }
})

# Configuration
UPLOAD_FOLDER = Path('uploads')
OUTPUT_FOLDER = Path('outputs')
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}

# Create folders if they don't exist
UPLOAD_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

# Store processing status in memory
processing_status = {}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def process_video_async(job_id, input_path, output_path, confidence, size, grace_period_frames=40, grace_period_seconds=2.0, exit_zone=None):
    """Process video in background thread with ByteTrack and stable occupancy"""
    try:
        processing_status[job_id]['status'] = 'processing'
        
        # Import the tracking module
        from crowd_tracking import CrowdTracker
        import subprocess
        
        tracker = CrowdTracker(
            confidence_threshold=confidence,
            target_size=size,
            grace_period_frames=grace_period_frames,
            grace_period_seconds=grace_period_seconds,
            exit_zone=exit_zone
        )
        
        # Process video with tracking
        temp_output = str(output_path).replace('.mp4', '_temp.mp4')
        tracker.process_video(
            input_path=str(input_path),
            output_path=temp_output,
            display=False,
            save_output=True
        )
        
        # Re-encode with FFmpeg for browser compatibility
        print(f"Re-encoding video for browser compatibility...")
        try:
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-i', temp_output,
                '-c:v', 'libx264',         # H.264 codec
                '-preset', 'fast',         # Encoding speed
                '-crf', '23',              # Quality (lower = better, 23 is default)
                '-pix_fmt', 'yuv420p',     # Pixel format for compatibility
                '-movflags', '+faststart', # Enable streaming
                str(output_path)
            ]
            
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                print(f"✓ Video re-encoded successfully for browser playback")
                # Delete temp file
                if os.path.exists(temp_output):
                    os.remove(temp_output)
            else:
                print(f"FFmpeg warning: {result.stderr}")
                # If FFmpeg fails, use the original output
                if os.path.exists(temp_output):
                    os.rename(temp_output, str(output_path))
                print(f"⚠ Using original video output (may not play in all browsers)")
                
        except FileNotFoundError:
            print("⚠ FFmpeg not found. Using original video output (may not play in all browsers)")
            # FFmpeg not available, use original output
            if os.path.exists(temp_output):
                os.rename(temp_output, str(output_path))
        except Exception as e:
            print(f"⚠ FFmpeg encoding failed: {e}. Using original output.")
            if os.path.exists(temp_output):
                os.rename(temp_output, str(output_path))
        
        processing_status[job_id]['status'] = 'completed'
        processing_status[job_id]['output_path'] = str(output_path)
        
    except Exception as e:
        processing_status[job_id]['status'] = 'failed'
        processing_status[job_id]['error'] = str(e)
        print(f"Error processing video: {e}")
        import traceback
        traceback.print_exc()


# ============================================================================
# CROWD DETECTION ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    import torch
    return jsonify({
        'status': 'healthy',
        'service': 'crowd-detection',
        'cuda_available': torch.cuda.is_available(),
        'gpu': torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'
    })


@app.route('/api/upload', methods=['POST'])
def upload_video():
    """Upload video for crowd detection processing"""
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Allowed: mp4, avi, mov, mkv'}), 400
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    filename = secure_filename(file.filename)
    input_path = UPLOAD_FOLDER / f"{job_id}_{filename}"
    file.save(input_path)
    
    # Get parameters - optimized defaults for bus detection
    confidence = float(request.form.get('confidence', 0.15))  # Very low for buses
    size = int(request.form.get('size', 1280))  # Large for better detection
    grace_period_frames = int(request.form.get('grace_period_frames', 45))
    grace_period_seconds = float(request.form.get('grace_period_seconds', 3.0))
    
    # Optional exit zone (format: "x1,y1,x2,y2")
    exit_zone_str = request.form.get('exit_zone', None)
    exit_zone = None
    if exit_zone_str:
        try:
            coords = [int(x.strip()) for x in exit_zone_str.split(',')]
            if len(coords) == 4:
                exit_zone = tuple(coords)
        except:
            pass
    
    # Validate parameters
    if not 0.1 <= confidence <= 1.0:
        return jsonify({'error': 'Confidence must be between 0.1 and 1.0'}), 400
    
    if size not in [640, 800, 1280, 1920]:
        return jsonify({'error': 'Size must be 640, 800, 1280, or 1920'}), 400
    
    if not 10 <= grace_period_frames <= 200:
        return jsonify({'error': 'Grace period frames must be between 10 and 200'}), 400
    
    # Setup output path
    output_path = OUTPUT_FOLDER / f"{job_id}_crowd_tracking_output.mp4"
    
    # Initialize status
    processing_status[job_id] = {
        'status': 'queued',
        'input_file': filename,
        'confidence': confidence,
        'size': size,
        'grace_period_frames': grace_period_frames,
        'grace_period_seconds': grace_period_seconds,
        'exit_zone': exit_zone
    }
    
    # Start processing in background
    thread = threading.Thread(
        target=process_video_async,
        args=(job_id, input_path, output_path, confidence, size, grace_period_frames, grace_period_seconds, exit_zone)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'job_id': job_id,
        'message': 'Video uploaded successfully. Processing started.',
        'status': 'queued'
    }), 202


@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id):
    """Get processing status for a job"""
    if job_id not in processing_status:
        return jsonify({
            'error': 'Job not found',
            'message': 'This job may have been lost due to server restart. Please upload the video again.',
            'job_id': job_id
        }), 404
    
    return jsonify(processing_status[job_id])


def send_video_stream(path, download=False, filename=None):
    """Send video file with proper Range request support for streaming"""
    path = str(path)
    
    if not os.path.exists(path):
        print(f"ERROR: Video file not found: {path}")
        return jsonify({'error': 'Video file not found'}), 404
    
    try:
        file_size = os.path.getsize(path)
        range_header = request.headers.get('Range', None)
        
        if not range_header:
            # No range request, send complete file
            with open(path, 'rb') as f:
                data = f.read()
            
            response = Response(data, status=200, mimetype='video/mp4')
            response.headers['Content-Length'] = str(file_size)
            response.headers['Accept-Ranges'] = 'bytes'
            
            if download and filename:
                response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
        
        # Parse range header
        byte_range = range_header.replace('bytes=', '').strip()
        start, end = byte_range.split('-')
        start = int(start) if start else 0
        end = int(end) if end else file_size - 1
        
        if start >= file_size:
            return Response(status=416)  # Range not satisfiable
        
        end = min(end, file_size - 1)
        length = end - start + 1
        
        # Read the requested range
        with open(path, 'rb') as f:
            f.seek(start)
            data = f.read(length)
        
        response = Response(data, status=206, mimetype='video/mp4')  # 206 Partial Content
        response.headers['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        response.headers['Content-Length'] = str(length)
        response.headers['Accept-Ranges'] = 'bytes'
        
        if download and filename:
            response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        print(f"ERROR streaming video: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error streaming video: {str(e)}'}), 500


@app.route('/api/download/<job_id>', methods=['GET'])
def download_video(job_id):
    """Download or stream processed video with Range request support"""
    print(f"Video request for job_id: {job_id}")
    
    if job_id not in processing_status:
        print(f"Job {job_id} not found in processing_status")
        return jsonify({'error': 'Job not found'}), 404
    
    status = processing_status[job_id]
    print(f"Job status: {status['status']}")
    
    if status['status'] != 'completed':
        return jsonify({'error': 'Video processing not completed'}), 400
    
    output_path = Path(status['output_path'])
    print(f"Output path: {output_path}")
    print(f"File exists: {output_path.exists()}")
    
    if not output_path.exists():
        return jsonify({'error': 'Output file not found'}), 404
    
    # Check if it's a download request or streaming (for video player)
    download = request.args.get('download', 'false').lower() == 'true'
    print(f"Download mode: {download}")
    
    # Create user-friendly filename
    original_name = status.get('input_file', 'video')
    base_name = original_name.rsplit('.', 1)[0] if '.' in original_name else original_name
    friendly_filename = f"{base_name}_analyzed.mp4"
    print(f"Serving video: {friendly_filename}")
    
    return send_video_stream(output_path, download=download, filename=friendly_filename)


@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    """List all processing jobs"""
    return jsonify({
        'jobs': [
            {
                'job_id': job_id,
                **status
            }
            for job_id, status in processing_status.items()
        ]
    })


@app.route('/api/cleanup/<job_id>', methods=['DELETE'])
def cleanup_job(job_id):
    """Clean up job files"""
    if job_id not in processing_status:
        return jsonify({'error': 'Job not found'}), 404
    
    # Delete files
    for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
        for file in folder.glob(f"{job_id}*"):
            try:
                file.unlink()
            except Exception as e:
                print(f"Error deleting {file}: {e}")
    
    # Remove from status
    del processing_status[job_id]
    
    return jsonify({'message': 'Job cleaned up successfully'})


# ============================================================================
# MOCK ENDPOINTS FOR FRONTEND COMPATIBILITY
# ============================================================================

@app.route('/api/alerts/fetch-alerts', methods=['GET'])
def fetch_alerts():
    """Mock endpoint - returns empty alerts list"""
    return jsonify([])


@app.route('/api/alerts/fetch-alert-count', methods=['GET'])
def fetch_alert_count():
    """Mock endpoint - returns zero alert count"""
    return jsonify({'count': 0})


@app.route('/api/residents/get-residents', methods=['GET'])
def get_residents():
    """Mock endpoint - returns empty residents list"""
    return jsonify([])


@app.route('/api/authorities/get-authorities', methods=['GET'])
def get_authorities():
    """Mock endpoint - returns empty authorities list"""
    return jsonify([])


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("CROWD DETECTION API SERVER")
    print("=" * 60)
    print("Starting server...")
    print("API available at: http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")
    print("")
    print("Endpoints:")
    print("  POST   /api/upload              - Upload video")
    print("  GET    /api/status/<job_id>     - Check status")
    print("  GET    /api/download/<job_id>   - Download result")
    print("  GET    /api/jobs                - List all jobs")
    print("  DELETE /api/cleanup/<job_id>    - Clean up job")
    print("  GET    /api/health              - Health check")
    print("")
    print("Mock endpoints (for frontend compatibility):")
    print("  GET    /api/alerts/fetch-alerts")
    print("  GET    /api/alerts/fetch-alert-count")
    print("")
    print("Note: Auto-reload disabled to preserve job status")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    print("")
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
