import { motion } from "framer-motion";
import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { MapPin, TrendingUp, TrendingDown, Layers } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Sample heatmap data for different localities (real coordinates - New York City area as example)
const HEATMAP_DATA = [
	{ id: 1, name: "Downtown Central", lat: 40.7589, lng: -73.9851, intensity: 95, alerts: 145, change: 12 },
	{ id: 2, name: "North Station", lat: 40.7831, lng: -73.9712, intensity: 78, alerts: 98, change: -5 },
	{ id: 3, name: "East Market", lat: 40.7489, lng: -73.9680, intensity: 65, alerts: 72, change: 8 },
	{ id: 4, name: "West Plaza", lat: 40.7614, lng: -73.9776, intensity: 88, alerts: 124, change: 15 },
	{ id: 5, name: "South Terminal", lat: 40.7489, lng: -73.9925, intensity: 52, alerts: 54, change: -3 },
	{ id: 6, name: "Central Park", lat: 40.7829, lng: -73.9654, intensity: 42, alerts: 38, change: -8 },
	{ id: 7, name: "Harbor District", lat: 40.7061, lng: -74.0087, intensity: 71, alerts: 86, change: 6 },
	{ id: 8, name: "University Area", lat: 40.8075, lng: -73.9626, intensity: 35, alerts: 29, change: -12 },
	{ id: 9, name: "Industrial Zone", lat: 40.7282, lng: -73.9942, intensity: 58, alerts: 63, change: 4 },
	{ id: 10, name: "Residential North", lat: 40.7956, lng: -73.9720, intensity: 28, alerts: 22, change: -2 },
	{ id: 11, name: "Shopping District", lat: 40.7484, lng: -73.9857, intensity: 82, alerts: 112, change: 18 },
	{ id: 12, name: "Airport Road", lat: 40.7769, lng: -73.9121, intensity: 48, alerts: 51, change: 1 },
];

const getHeatColor = (intensity) => {
	// Google Maps style heat gradient: Blue → Cyan → Green → Yellow → Orange → Red
	if (intensity >= 80) return "#EF4444"; // Red - Critical
	if (intensity >= 60) return "#F97316"; // Orange - High
	if (intensity >= 40) return "#EAB308"; // Yellow - Medium-High
	if (intensity >= 20) return "#22C55E"; // Green - Medium
	return "#3B82F6"; // Blue - Low
};

const getHeatRadius = (intensity) => {
	return 5 + (intensity / 100) * 15;
};

const AlertHeatmap = () => {
	const [selectedPoint, setSelectedPoint] = useState(null);
	const [mapStyle, setMapStyle] = useState("streets");

	const mapStyles = {
		streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
		light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
	};

	return (
		<motion.div
			className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 hover:border-blue-500/30 transition-all duration-300"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5 }}
			whileHover={{ y: -2 }}
		>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
					<div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
					Alert Heatmap
				</h2>
				<div className="flex items-center gap-2">
					<button
						onClick={() => setMapStyle(mapStyle === "dark" ? "streets" : "dark")}
						className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 bg-gray-700/50 px-3 py-1.5 rounded-lg"
						title="Toggle map style"
					>
						<Layers className="w-4 h-4" />
						{mapStyle === "dark" ? "Dark" : "Streets"}
					</button>
					<div className="flex items-center gap-2 text-sm text-gray-400">
						<MapPin className="w-4 h-4" />
						<span>City Overview</span>
					</div>
				</div>
			</div>

			<div className="relative h-[500px] rounded-lg overflow-hidden border border-gray-700/50">
				<MapContainer
					center={[40.7589, -73.9851]}
					zoom={13}
					style={{ height: "100%", width: "100%", background: "#1F2937" }}
					zoomControl={true}
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
						url={mapStyles[mapStyle]}
					/>

					{/* Render heat circles as markers */}
					{HEATMAP_DATA.map((point) => {
						const radius = getHeatRadius(point.intensity);
						const color = getHeatColor(point.intensity);

						return (
							<CircleMarker
								key={point.id}
								center={[point.lat, point.lng]}
								radius={radius}
								pathOptions={{
									fillColor: color,
									fillOpacity: 0.7,
									color: color,
									weight: 2,
									opacity: 0.9,
								}}
								eventHandlers={{
									click: () => {
										setSelectedPoint(selectedPoint?.id === point.id ? null : point);
									},
								}}
							>
								<Popup>
									<div className="p-2 min-w-[200px]">
										<div className="flex items-center gap-2 mb-2">
											<div 
												className="w-3 h-3 rounded-full" 
												style={{ backgroundColor: color }}
											/>
											<p className="font-semibold text-gray-800">{point.name}</p>
										</div>
										<div className="space-y-1 text-sm">
											<div className="flex items-center justify-between gap-4">
												<span className="text-gray-600">Active Alerts:</span>
												<span className="font-bold" style={{ color }}>{point.alerts}</span>
											</div>
											<div className="flex items-center justify-between gap-4">
												<span className="text-gray-600">Intensity:</span>
												<span className="text-gray-800 font-semibold">{point.intensity}%</span>
											</div>
											<div className="flex items-center justify-between gap-4">
												<span className="text-gray-600">Change:</span>
												<span className={`flex items-center gap-1 font-semibold ${point.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
													{point.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
													{Math.abs(point.change)}%
												</span>
											</div>
										</div>
									</div>
								</Popup>
							</CircleMarker>
						);
					})}
				</MapContainer>
			</div>

			{/* Legend */}
			<div className="mt-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="text-xs text-gray-400">Alert Density:</span>
					<div className="flex items-center gap-2">
						{[
							{ label: "Low", intensity: 10, color: "#3B82F6" },
							{ label: "Medium", intensity: 30, color: "#22C55E" },
							{ label: "High", intensity: 70, color: "#F97316" },
							{ label: "Critical", intensity: 90, color: "#EF4444" },
						].map((item) => {
							return (
								<div key={item.label} className="flex items-center gap-1">
									<div
										className="w-4 h-4 rounded-full border border-gray-600"
										style={{ backgroundColor: item.color }}
									/>
									<span className="text-xs text-gray-400">{item.label}</span>
								</div>
							);
						})}
					</div>
				</div>
				<div className="text-xs text-gray-500">
					Click markers for details
				</div>
			</div>

			{/* Selected point details */}
			{selectedPoint && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					className="mt-4 bg-gray-900/50 rounded-lg p-4 border"
					style={{ borderColor: `${getHeatColor(selectedPoint.intensity)}40` }}
				>
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-white font-semibold flex items-center gap-2">
							<div 
								className="w-3 h-3 rounded-full" 
								style={{ backgroundColor: getHeatColor(selectedPoint.intensity) }}
							/>
							{selectedPoint.name}
						</h3>
						<button
							onClick={() => setSelectedPoint(null)}
							className="text-gray-400 hover:text-white transition-colors"
						>
							×
						</button>
					</div>
					<div className="grid grid-cols-3 gap-4">
						<div>
							<p className="text-xs text-gray-400 mb-1">Active Alerts</p>
							<p className="text-lg font-bold" style={{ color: getHeatColor(selectedPoint.intensity) }}>
								{selectedPoint.alerts}
							</p>
						</div>
						<div>
							<p className="text-xs text-gray-400 mb-1">Intensity</p>
							<p className="text-lg font-bold text-white">{selectedPoint.intensity}%</p>
						</div>
						<div>
							<p className="text-xs text-gray-400 mb-1">24h Change</p>
							<p className={`text-lg font-bold flex items-center gap-1 ${selectedPoint.change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
								{selectedPoint.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
								{selectedPoint.change >= 0 ? '+' : ''}{selectedPoint.change}%
							</p>
						</div>
					</div>
				</motion.div>
			)}
		</motion.div>
	);
};

export default AlertHeatmap;
