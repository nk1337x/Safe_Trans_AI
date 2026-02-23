# SafeRide Mobile Integration Guide

## Overview
The Flutter CCTV Simulation app has been configured to work with the SafeRide crowd detection backend.

## What Was Changed

### 1. **Branding Updates**
- App name: "CCTV Simulation" → "SafeRide"
- Color theme: Purple (#6366F1) → Blue (#3B82F6)
- Icons updated to match SafeRide web dashboard

### 2. **Location Coordinates**
Updated all locations to match the SafeRide frontend heatmap (NYC area):
- Downtown Central: 40.7589, -73.9851
- North Station: 40.7831, -73.9712
- East Market: 40.7489, -73.9680
- West Plaza: 40.7614, -73.9776
- South Terminal: 40.7489, -73.9925
- Central Park: 40.7829, -73.9654
- Harbor District: 40.7061, -74.0087
- University Area: 40.8075, -73.9626
- Industrial Zone: 40.7282, -73.9942
- Residential North: 40.7956, -73.9720
- Shopping District: 40.7484, -73.9857
- Airport Road: 40.7769, -73.9121

### 3. **API Integration**
Updated to work with SafeRide backend API:

**Old Endpoint:** `POST /analyze` (immediate response)
**New Endpoint:** `POST /api/upload` (async job-based)

**Workflow:**
1. Upload video → Receive job_id
2. Poll `/api/status/{job_id}` every 2 seconds
3. When complete, download from `/api/download/{job_id}`

### 4. **New Features Added**
- ✅ Settings page for configuring backend URL
- ✅ Real-time status polling with timer
- ✅ Progress indicators during processing
- ✅ Error handling and user feedback
- ✅ Server URL persistence using SharedPreferences

## How to Use

### Setup Backend Connection
1. Make sure SafeRide backend is running (`python backend/app.py`)
2. Note your backend IP address (e.g., `192.168.1.100`)
3. Open the Flutter app
4. Tap Settings icon → Enter `http://YOUR_IP:5000` → Save

### Upload Video for Analysis
1. Select a location from the list
2. Tap "Next"
3. Tap "Pick Video" and select a video
4. Tap "Upload Video"
5. Wait for processing (status updates automatically)
6. When complete, download URL will be available

## Files Modified

### Pages
- `lib/pages/register_camera_page.dart`
  - Updated locations and coordinates
  - Changed branding to SafeRide
  - Updated colors to blue theme
  
- `lib/pages/video_upload_page.dart`
  - Complete rewrite for async API integration
  - Added status polling mechanism
  - Updated UI and colors
  - Improved error handling

- `lib/pages/settings_page.dart` *(NEW)*
  - Server URL configuration
  - Persistent settings storage

## Integration Flow

```
Mobile App (Flutter)
      ↓
   Upload Video
      ↓
Backend API (/api/upload)
      ↓
  Crowd Detection Model (YOLO11x)
      ↓
  Processing Status (queued → processing → completed)
      ↓
 Download Processed Video
      ↓
(Optional) View in Dashboard
```

## Testing Checklist

- [ ] Backend server is running and accessible
- [ ] Flutter app can connect to backend (check Settings)
- [ ] Can select location and navigate to upload page
- [ ] Can pick video from gallery
- [ ] Video upload returns job_id
- [ ] Status updates appear during processing
- [ ] Can access download URL when complete
- [ ] Error messages display correctly

## Network Configuration

**Local Development:**
- Backend: `http://localhost:5000` (or your computer's IP)
- Mobile device and computer must be on same WiFi network

**Production:**
- Update backend URL to your production server
- Ensure server is accessible from mobile network

## Next Steps (Optional Enhancements)

1. **Database Integration**
   - Store upload history locally
   - Cache previous locations

2. **Notifications**
   - Push notifications when processing completes
   - Background processing support

3. **Analytics**
   - Show detection results (person count, crowd level)
   - History of uploaded videos

4. **Camera Integration**
   - Record video directly from camera
   - Real-time streaming (future)

---

**Need Help?**
- Check backend logs: `python backend/app.py`
- Verify network connectivity
- Ensure video file is in supported format (mp4, avi, mov, mkv)
- Check Settings for correct server URL
