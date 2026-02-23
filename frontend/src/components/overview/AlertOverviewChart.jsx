import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";

const alertData = [
	{ name: "Jul", alerts: 120 },
	{ name: "Aug", alerts: 100 },
	{ name: "Sep", alerts: 150 },
	{ name: "Oct", alerts: 130 },
	{ name: "Nov", alerts: 180 },
	{ name: "Dec", alerts: 210 },
	{ name: "Jan", alerts: 200 },
	{ name: "Feb", alerts: 190 },
	{ name: "Mar", alerts: 220 },
	{ name: "Apr", alerts: 210 },
	{ name: "May", alerts: 230 },
	{ name: "Jun", alerts: 250 },
];

const CustomTooltip = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className='bg-gray-800 bg-opacity-95 backdrop-blur-sm border border-blue-500/30 rounded-lg p-3 shadow-xl'>
				<p className='text-gray-200 font-semibold mb-1'>{label}</p>
				<p className='text-blue-400 font-bold text-lg'>
					{payload[0].value} alerts
				</p>
				<p className='text-gray-400 text-xs mt-1'>
					{payload[0].value > 200 ? '📈 High activity' : payload[0].value > 150 ? '📊 Moderate' : '📉 Low activity'}
				</p>
			</div>
		);
	}
	return null;
};

const AlertOverviewChart = () => {
	return (
		<motion.div
			className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 hover:border-blue-500/30 transition-all duration-300'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
			whileHover={{ y: -2 }}
		>
			<h2 className='text-xl font-semibold mb-4 text-gray-100 flex items-center gap-2'>
				<div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full' />
				Alert Overview
			</h2>

			<div className='h-80'>
				<ResponsiveContainer width={"100%"} height={"100%"}>
					<AreaChart data={alertData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
						<defs>
							<linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
								<stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray='3 3' stroke='#374151' opacity={0.3} />
						<XAxis 
							dataKey={"name"} 
							stroke='#9ca3af'
							tick={{ fill: '#D1D5DB', fontSize: 12 }}
							ticLine={false}
						>
							<Label
								value='Months'
								offset={-10}
								position='insideBottom'
								style={{ fill: "#9ca3af", fontSize: "12px", fontWeight: 500 }}
							/>
						</XAxis>
						<YAxis 
							stroke='#9ca3af'
							tick={{ fill: '#D1D5DB', fontSize: 12 }}
							ticLine={false}
							axisLine={false}
						>
							<Label
								value='Number of Alerts'
								angle={-90}
								position='insideLeft'
								style={{ fill: "#9ca3af", fontSize: "12px", fontWeight: 500 }}
							/>
						</YAxis>
						<Tooltip content={<CustomTooltip />} />
						<Area
							type='monotone'
							dataKey='alerts'
							stroke='#3B82F6'
							fill='url(#colorAlerts)'
							strokeWidth={3}
							animationDuration={1500}
							animationBegin={200}
						/>
						<Line
							type='monotone'
							dataKey='alerts'
							stroke='#3B82F6'
							strokeWidth={3}
							dot={{ fill: "#3B82F6", strokeWidth: 2, r: 5, stroke: '#1E3A8A' }}
							activeDot={{ r: 8, strokeWidth: 2, fill: '#60A5FA', stroke: '#1E3A8A' }}
							animationDuration={1500}
							animationBegin={200}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</motion.div>
	);
};

export default AlertOverviewChart;
