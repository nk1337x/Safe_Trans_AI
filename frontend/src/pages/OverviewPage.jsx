import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Video,
  Activity,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  Camera,
} from "lucide-react";

import Header from "../components/common/Header";
import { useNavigate } from "react-router-dom";
import AlertOverviewChart from "../components/overview/AlertOverviewChart";
import CategoryDistributionChart from "../components/overview/CategoryDistributionChart";
import AlertSourcesChart from "../components/overview/AlertSourcesChart";
import AlertHeatmap from "../components/overview/AlertHeatmap";

const OverviewPage = () => {
  const navigate = useNavigate();

  const stats = [
    { name: "Total Active Incidents", value: 244, icon: Activity, color: "blue", bgColor: "bg-gray-800/50" },
    { name: "Pending Alerts", value: 2, icon: Clock, color: "purple", bgColor: "bg-gray-800/50" },
    { name: "Critical Alerts", value: 1, icon: AlertTriangle, color: "red", bgColor: "bg-red-900/20", border: "border-red-500/30" },
    { name: "Resolved Incidents", value: 235, icon: CheckCircle, color: "blue", bgColor: "bg-blue-900/20", border: "border-blue-500/30" },
    { name: "Total Alerts Today", value: 59, icon: Bell, color: "blue", bgColor: "bg-gray-800/50" },
    { name: "Offline Cameras", value: 15, icon: XCircle, color: "red", bgColor: "bg-red-900/20", border: "border-red-500/30" },
    { name: "Cameras with Active Alerts", value: 40, icon: Camera, color: "blue", bgColor: "bg-blue-900/20", border: "border-blue-500/30" },
    { name: "Resolved Alerts", value: 40, icon: CheckCircle, color: "blue", bgColor: "bg-blue-900/20", border: "border-blue-500/30" },
  ];

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-900">
      <Header title="SafeTrans Dashboard" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex gap-4"
        >
          <button
            onClick={() => navigate("/crowd-detection")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-medium"
          >
            <Video className="w-5 h-5" />
            New Analysis
          </button>
          <button
            onClick={() => navigate("/alerts")}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all border border-gray-700 font-medium"
          >
            <AlertTriangle className="w-5 h-5" />
            View Alerts
          </button>
        </motion.div>

        {/* Stats Grid - 8 cards in 4 columns */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${stat.bgColor} rounded-xl p-5 border ${stat.border || 'border-gray-700/50'} backdrop-blur-md shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <h3 className="text-gray-400 text-sm font-medium">
                {stat.name}
              </h3>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AlertOverviewChart />
          <CategoryDistributionChart />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <AlertSourcesChart />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <AlertHeatmap />
        </div>
      </main>
    </div>
  );
};

export default OverviewPage;
