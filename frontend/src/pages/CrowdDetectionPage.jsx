import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Video,
  Download,
  AlertCircle,
  CheckCircle,
  Loader,
  Users,
  Settings,
  Play,
  Trash2,
} from "lucide-react";
import Header from "../components/common/Header";
import { Player } from "@lottiefiles/react-lottie-player";

const CrowdDetectionPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confidence, setConfidence] = useState(0.45);
  const [inferenceSize, setInferenceSize] = useState(640);
  const [jobs, setJobs] = useState([]);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const fileInputRef = useRef(null);

  const API_URL = "http://localhost:5000/api";

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setStatus(null);
      setJobId(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("confidence", confidence);
    formData.append("size", inferenceSize);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setJobId(data.job_id);
        setStatus(data.status);
        pollStatus(data.job_id);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const pollStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/status/${id}`);
        
        if (!response.ok) {
          // Job not found or error
          clearInterval(interval);
          const data = await response.json();
          alert(data.message || 'Job not found. Please try uploading again.');
          setJobId(null);
          setStatus(null);
          return;
        }
        
        const data = await response.json();
        setStatus(data.status);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          fetchJobs();
        }
      } catch (error) {
        console.error("Status poll error:", error);
        clearInterval(interval);
      }
    }, 2000);
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs`);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const handleDownload = async (id) => {
    try {
      const response = await fetch(`${API_URL}/download/${id}?download=true`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crowd_detection_${id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };

  const handlePlayVideo = async (id) => {
    try {
      const videoUrl = `${API_URL}/download/${id}`;
      setCurrentVideoUrl(videoUrl);
      setShowVideoPlayer(true);
    } catch (error) {
      alert(`Failed to load video: ${error.message}`);
    }
  };

  const closeVideoPlayer = () => {
    setShowVideoPlayer(false);
    setCurrentVideoUrl(null);
  };

  const handleCleanup = async (id) => {
    try {
      await fetch(`${API_URL}/cleanup/${id}`, { method: "DELETE" });
      fetchJobs();
      if (jobId === id) {
        setJobId(null);
        setStatus(null);
      }
    } catch (error) {
      alert(`Cleanup failed: ${error.message}`);
    }
  };

  React.useEffect(() => {
    fetchJobs();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "processing":
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-900">
      <Header title="Crowd Detection System" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 mb-8 border border-gray-700"
        >
          <div className="flex items-center justify-between flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-blue-500" />
                <h2 className="text-3xl font-bold text-white">
                  AI-Powered Crowd Detection
                </h2>
              </div>
              <p className="text-gray-300 text-lg mb-4">
                Upload a video and let our YOLOv8m model with ByteTrack detect and track
                people with unique IDs. Optimized for stable counting in crowded scenes.
              </p>
              <div className="flex gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>ByteTrack Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Unique ID Assignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Stable Counting</span>
                </div>
              </div>
            </div>
            <div className="w-48 h-48">
              <Player
                autoplay
                loop
                src="https://assets5.lottiefiles.com/packages/lf20_xyadoh9h.json"
                className="w-full h-full"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-500" />
              Upload Video
            </h3>

            {/* File Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors mb-6"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">
                {selectedFile
                  ? selectedFile.name
                  : "Click to select video file"}
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: MP4, AVI, MOV, MKV (Max 500MB)
              </p>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confidence Threshold: {confidence.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 0.4 for stable tracking
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Inference Size: {inferenceSize}px
                </label>
                <select
                  value={inferenceSize}
                  onChange={(e) => setInferenceSize(parseInt(e.target.value))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600"
                >
                  <option value={416}>416 (Fast)</option>
                  <option value={640}>640 (Balanced)</option>
                  <option value={800}>800 (Accurate)</option>
                  <option value={1280}>1280 (Best Quality)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  640 or 800 recommended for crowd tracking
                </p>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Processing
                </>
              )}
            </button>

            {/* Current Job Status */}
            {jobId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <p className="text-white font-medium">
                        Job ID: {jobId.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-400 capitalize">
                        Status: {status}
                      </p>
                    </div>
                  </div>
                  {status === "completed" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePlayVideo(jobId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Play Video
                      </button>
                      <button
                        onClick={() => handleDownload(jobId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-500" />
              System Info
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Model</p>
                <p className="text-white font-semibold">YOLOv8m</p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Detection Class</p>
                <p className="text-white font-semibold">Person Only</p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Hardware</p>
                <p className="text-white font-semibold">GPU Accelerated</p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Output Format</p>
                <p className="text-white font-semibold">MP4 Video</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 Tip: Use 640px inference size for balanced speed and
                accuracy. Increase confidence threshold to reduce false
                positives.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Jobs History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-6">
            Processing History
          </h3>

          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No processing jobs yet. Upload a video to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(job.status)}
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {job.input_file}
                      </p>
                      <p className="text-sm text-gray-400">
                        Confidence: {job.confidence} | Size: {job.size}px |
                        Status: {job.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {job.status === "completed" && (
                      <>
                        <button
                          onClick={() => handlePlayVideo(job.job_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                          title="Play Video"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(job.job_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleCleanup(job.job_id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Video Player Modal */}
        {showVideoPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={closeVideoPlayer}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 max-w-6xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Play className="w-6 h-6 text-blue-500" />
                  Processed Video
                </h3>
                <button
                  onClick={closeVideoPlayer}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  key={currentVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[70vh]"
                  src={currentVideoUrl}
                  onError={(e) => {
                    console.error("Video playback error:", e);
                    alert("Unable to play video. Try downloading instead.");
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <p className="text-gray-400 text-sm">
                  Video shows detected persons with bounding boxes and count overlay
                </p>
                <button
                  onClick={() => {
                    const id = currentVideoUrl.split('/').pop();
                    handleDownload(id);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Video
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CrowdDetectionPage;
