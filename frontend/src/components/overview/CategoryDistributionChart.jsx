import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from "recharts";
import { useState } from "react";

const ALERT_CATEGORY_DATA = [
	{ name: "Women Abuse", value: 40 },
	{ name: "Vandalism", value: 25 },
	{ name: "Suspicious Activity", value: 20 },
	{ name: "Emergency", value: 10 },
	{ name: "Other", value: 5 },
];

const COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];

const CustomTooltip = ({ active, payload }) => {
	if (active && payload && payload.length) {
		const data = payload[0];
		return (
			<div className='bg-gray-800 bg-opacity-95 backdrop-blur-sm border border-blue-500/30 rounded-lg p-3 shadow-xl'>
				<p className='text-gray-200 font-semibold mb-1'>{data.name}</p>
				<p className='text-blue-400 font-bold text-lg'>
					{data.value}%
				</p>
				<p className='text-gray-400 text-xs mt-1'>
					{data.payload.value} incidents
				</p>
			</div>
		);
	}
	return null;
};

const renderActiveShape = (props) => {
	const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
	return (
		<g>
			<Sector
				cx={cx}
				cy={cy}
				innerRadius={innerRadius}
				outerRadius={outerRadius + 8}
				startAngle={startAngle}
				endAngle={endAngle}
				fill={fill}
			/>
			<Sector
				cx={cx}
				cy={cy}
				startAngle={startAngle}
				endAngle={endAngle}
				innerRadius={outerRadius + 10}
				outerRadius={outerRadius + 12}
				fill={fill}
			/>
		</g>
	);
};

const CategoryDistributionChart = () => {
	const [activeIndex, setActiveIndex] = useState(null);

	const onPieEnter = (_, index) => {
		setActiveIndex(index);
	};

	const onPieLeave = () => {
		setActiveIndex(null);
	};

	return (
		<motion.div
			className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 hover:border-blue-500/30 transition-all duration-300'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.3 }}
			whileHover={{ y: -2 }}
		>
			<h2 className='text-xl font-semibold mb-4 text-gray-100 flex items-center gap-2'>
				<div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full' />
				Alert Category Distribution
			</h2>
			<div className='h-80'>
				<ResponsiveContainer width={"100%"} height={"100%"}>
					<PieChart>
						<Pie
							data={ALERT_CATEGORY_DATA}
							cx={"50%"}
							cy={"45%"}
							labelLine={false}
							innerRadius={60}
							outerRadius={90}
							fill='#8884d8'
							dataKey='value'
							animationBegin={300}
							animationDuration={1200}
							onMouseEnter={onPieEnter}
							onMouseLeave={onPieLeave}
							activeIndex={activeIndex}
							activeShape={renderActiveShape}
							label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
								const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
								const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
								const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
								return (
									<text 
										x={x} 
										y={y} 
										fill="white" 
										textAnchor={x > cx ? 'start' : 'end'} 
										dominantBaseline="central"
										className="text-sm font-bold"
									>
										{`${(percent * 100).toFixed(1)}%`}
									</text>
								);
							}}
						>
							{ALERT_CATEGORY_DATA.map((entry, index) => (
								<Cell 
									key={`cell-${index}`} 
									fill={COLORS[index % COLORS.length]}
									stroke={activeIndex === index ? '#1E3A8A' : 'transparent'}
									strokeWidth={activeIndex === index ? 3 : 0}
								/>
							))}
						</Pie>
						<Tooltip content={<CustomTooltip />} />
						<Legend 
							wrapperStyle={{ color: "#E5E7EB", paddingTop: '10px' }}
							iconType="circle"
							verticalAlign="bottom"
						/>
					</PieChart>
				</ResponsiveContainer>
			</div>
		</motion.div>
	);
};

export default CategoryDistributionChart;
