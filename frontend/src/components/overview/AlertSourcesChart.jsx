import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

const COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

const ALERT_SOURCES_DATA = [
	{ name: "CCTV Cameras", value: 240 },
	{ name: "Patrol Reports", value: 180 },
	{ name: "Citizen Reports", value: 120 },
	{ name: "Social Media", value: 60 },
];

const CustomTooltip = ({ active, payload }) => {
	if (active && payload && payload.length) {
		return (
			<div className='bg-gray-800 bg-opacity-95 backdrop-blur-sm border border-blue-500/30 rounded-lg p-3 shadow-xl'>
				<p className='text-gray-200 font-semibold mb-1'>{payload[0].payload.name}</p>
				<p className='text-blue-400 font-bold text-lg'>
					{payload[0].value} alerts
				</p>
			</div>
		);
	}
	return null;
};

const AlertSourcesChart = () => {
	return (
		<motion.div
			className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 hover:border-blue-500/30 transition-all duration-300'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.4 }}
			whileHover={{ y: -2 }}
		>
			<h2 className='text-xl font-semibold mb-4 text-gray-100 flex items-center gap-2'>
				<div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full' />
				Alert Sources
			</h2>

			<div className='h-80'>
				<ResponsiveContainer>
					<BarChart data={ALERT_SOURCES_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
						<defs>
							{ALERT_SOURCES_DATA.map((entry, index) => (
								<linearGradient key={`gradient-${index}`} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9} />
									<stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6} />
								</linearGradient>
							))}
						</defs>
						<CartesianGrid strokeDasharray='3 3' stroke='#374151' opacity={0.3} />
						<XAxis 
							dataKey='name' 
							stroke='#9CA3AF' 
							tick={{ fill: '#D1D5DB', fontSize: 12 }}
							ticeLine={false}
						/>
						<YAxis 
							stroke='#9CA3AF'
							tick={{ fill: '#D1D5DB', fontSize: 12 }}
							ticeLine={false}
							axisLine={false}
						/>
						<Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
						<Legend 
							wrapperStyle={{ color: '#E5E7EB', paddingTop: '20px' }}
							iconType="circle"
						/>
						<Bar 
							dataKey={"value"} 
							radius={[8, 8, 0, 0]}
							maxBarSize={80}
							animationDuration={1000}
							animationBegin={300}
						>
							{ALERT_SOURCES_DATA.map((entry, index) => (
								<Cell 
									key={`cell-${index}`} 
									fill={`url(#colorGradient${index})`}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</motion.div>
	);
};

export default AlertSourcesChart;
