# SafeTrans

Smart crowd detection and monitoring for safer spaces.

## What is SafeTrans?

SafeTrans helps you understand crowd density in real-time by analyzing video footage. Whether you're managing public transportation, monitoring events, or keeping facilities safe, SafeTrans uses state-of-the-art AI to detect and track people accurately.

Built with YOLO11 and ByteTrack, the system gives you reliable occupancy insights when you need them most.

## What Can It Do?

- Detect and track people in real-time video
- Maintain stable tracking IDs across video frames
- Process uploaded videos and monitor job progress
- Visualize crowd analytics through an intuitive dashboard
- Integrate easily with your existing systems via REST API
- Run faster with GPU acceleration when available

## Built With

**Backend**
- Python with Flask for the API server
- PyTorch and YOLO11 for AI-powered detection
- OpenCV for video processing
- ByteTrack for tracking people across frames

**Frontend**
- React 18 with Vite for a fast, modern UI
- Tailwind CSS for clean styling
- Chart.js and Recharts for data visualization
- Framer Motion for smooth animations

## Getting Started

### What You'll Need
- Python 3.8 or newer
- Node.js 16 or newer
- FFmpeg (optional, helps with video compatibility)
- A CUDA-compatible GPU (optional, but makes things faster)

### Setting Up the Backend

Navigate to the backend folder and install dependencies:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Your backend will be running at `http://localhost:5000`

### Setting Up the Frontend

Open a new terminal, go to the frontend folder, and start the dev server:

```bash
cd frontend
npm install
npm start
```

The dashboard will open at `http://localhost:5173`

## How to Use It

1. Fire up both the backend and frontend servers
2. Open the web dashboard in your browser
3. Upload a video you want to analyze
4. Watch the processing happen in real-time
5. Review the results with tracking overlays and statistics
6. Download the annotated video if you need it

## API Reference

The backend exposes a simple REST API:

**Check System Health**
```
GET /api/health
```
See if the service is running and whether GPU is available.

**Upload a Video**
```
POST /api/upload
```
Send a video file to start crowd detection.

**Check Job Status**
```
GET /api/status/<job_id>
```
See how your video processing is going.

**Download Results**
```
GET /api/download/<job_id>
```
Get your processed video with all the annotations.

## System Requirements

**Minimum Setup**
- Quad-core processor
- 8GB RAM
- 10GB free storage

**Works Best With**
- 8-core processor
- 16GB RAM
- NVIDIA GPU with 6GB+ VRAM
- 50GB free storage

## Configuration Tips

You can tweak detection settings in `crowd_tracking.py`:
- `confidence_threshold`: How confident the AI needs to be (default: 0.15)
- `target_size`: Processing resolution (default: 1280)
- `grace_period_frames`: How long to keep tracking people who disappear briefly
- `exit_zone`: Define areas to count people entering or leaving

Need to change the API endpoint? Update it in your frontend code:
```javascript
const API_URL = 'http://localhost:5000/api';
```

## License

MIT License

## Need Help?

Run into issues or have ideas for new features? Open an issue and we'll take a look.
