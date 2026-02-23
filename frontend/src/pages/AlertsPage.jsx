import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  Play,
  Download,
  X,
  Camera,
  Bell,
  Trash2,
} from "lucide-react";
import Header from "../components/common/Header";
import { Player } from "@lottiefiles/react-lottie-player";
import Emergency from "../../assets/lottie/Emergency.json";

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const API_URL = "http://localhost:5000/api";

  // Fetch completed crowd detection jobs as alerts
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs`);
      const data = await response.json();
      
      // Convert completed jobs to alerts
      const completedJobs = data.jobs
        .filter(job => job.status === "completed")
        .map(job => ({
          id: job.job_id,
          title: "Crowd Detected",
          description: `Analysis completed for ${job.input_file}`,
          location: "Video Analysis",
          timestamp: new Date().toISOString(),
          severity: "high", // You can calculate this based on person count
          personCount: Math.floor(Math.random() * 50) + 10, // Placeholder
          videoUrl: `${API_URL}/download/${job.job_id}`,
          confidence: job.confidence,
          size: job.size,
        }));
      
      setAlerts(completedJobs);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500 text-red-400";
      case "high":
        return "bg-orange-500/20 border-orange-500 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      default:
        return "bg-blue-500/20 border-blue-500 text-blue-400";
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-gray-900",
      low: "bg-blue-500 text-white",
    };
    return colors[severity] || colors.low;
  };

  const handlePlayVideo = (alert) => {
    setSelectedAlert(alert);
    setShowVideoModal(true);
  };

  const handleDownload = async (alert) => {
    try {
      const response = await fetch(`${alert.videoUrl}?download=true`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${alert.description.replace('Analysis completed for ', '').replace('.mp4', '')}_analyzed.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative bg-gradient-to-br from-gray-800 via-gray-900 to-black text-gray-100 min-h-screen">
      <Header title="Alerts" />
      
      {/* Hero Section with Lottie */}
      <div className="flex flex-col items-center justify-center py-10">
        <Player autoplay loop src={Emergency} className="w-48 h-48" />
        <p className="text-center text-gray-300 text-lg max-w-xl mt-4">
          Monitor crowd detection alerts in real-time. Click on an alert to view detailed analysis and footage.
        </p>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Alerts Grid */}
        {alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-12 text-center border border-gray-700"
          >
            <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Alerts Found</h3>
            <p className="text-gray-500">
              Process videos in Crowd Detection to generate alerts
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative bg-red-600 p-5 rounded-lg shadow-lg hover:shadow-2xl hover:bg-red-500 transition-all transform hover:scale-105 cursor-pointer"
                onClick={() => handlePlayVideo(alert)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-transparent opacity-40 rounded-lg blur-md"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={28} className="text-white" />
                      <span className={`text-xs px-2 py-1 rounded-full ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    {alert.title}
                  </h3>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Users className="w-4 h-4" />
                      <span><strong>{alert.personCount}</strong> people detected</span>
                    </div>
                    <div className="flex items-center gap-2 text-white text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{alert.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Video Player Modal with Glass-morphism */}
        {showVideoModal && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden w-full max-w-5xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glass-effect header */}
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md border-b border-gray-700 p-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                    className="mr-3 text-red-400"
                  >
                    <AlertTriangle size={24} />
                  </motion.div>
                  Alert Details
                  <span className="ml-2 px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 text-xs rounded-md">
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                </h2>

                <button
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full p-2 transition-all duration-200 transform hover:rotate-90"
                  onClick={() => setShowVideoModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content area */}
              <div className="p-6">
                {/* Alert info grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">People Detected</p>
                    <p className="text-lg font-bold text-blue-400">{selectedAlert.personCount}</p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm font-medium text-gray-200">{selectedAlert.location}</p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Time</p>
                    <p className="text-sm font-medium text-gray-200">
                      {new Date(selectedAlert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="text-sm font-medium text-yellow-400">Active</p>
                  </div>
                </div>

                {/* Video Player */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative w-full rounded-lg overflow-hidden border border-gray-700 shadow-lg mb-6 bg-black"
                >
                  <video
                    key={selectedAlert.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[60vh]"
                    src={selectedAlert.videoUrl}
                    onError={(e) => {
                      console.error("Video playback error:", e);
                      alert("Unable to play video. Try downloading instead.");
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </motion.div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    }}
                    className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 py-4 px-4 rounded-lg shadow-lg transition border border-gray-700"
                    onClick={() => handleDownload(selectedAlert)}
                  >
                    <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full mb-2">
                      <Download className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm">Download</span>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    }}
                    className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 py-4 px-4 rounded-lg shadow-lg transition border border-gray-700"
                  >
                    <div className="bg-red-500 bg-opacity-20 p-3 rounded-full mb-2">
                      <MapPin className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-sm">View Location</span>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    }}
                    className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 py-4 px-4 rounded-lg shadow-lg transition border border-gray-700"
                  >
                    <div className="bg-amber-500 bg-opacity-20 p-3 rounded-full mb-2">
                      <Bell className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-sm">Notify</span>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    }}
                    className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 py-4 px-4 rounded-lg shadow-lg transition border border-gray-700"
                  >
                    <div className="bg-purple-500 bg-opacity-20 p-3 rounded-full mb-2">
                      <Camera className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-sm">Nearest CCTV</span>
                  </motion.button>
                </div>

                {/* Footer info */}
                <div className="mt-4 text-gray-400 text-sm bg-gray-800 bg-opacity-30 p-3 rounded-lg">
                  <p>Confidence: {selectedAlert.confidence} • Size: {selectedAlert.size}px</p>
                  <p className="mt-1">Video shows detected persons with bounding boxes and count overlay</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AlertsPage;
