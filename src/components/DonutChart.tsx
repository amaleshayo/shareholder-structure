import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Shareholder } from '../types';

const DEFAULT_COLORS = ['#59B0FF', '#FFD166', '#FF8C8C', '#7ED9C8', '#C4C7F5', '#B6E3A8'];

interface DonutChartProps {
    data: Shareholder[];
}

export default function DonutChart({ data }: DonutChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const chartData = data.map((d, i) => ({
        name: d.name,
        value: Number(d.percent.toFixed(2)),
        color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));

    return (
        <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={chartData}
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={1}
                        dataKey="value"
                        onMouseEnter={(_, idx) => setActiveIndex(idx)}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`slice-${index}`} fill={entry.color} strokeWidth={activeIndex === index ? 3 : 1} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            <div className="legend">
                {chartData.map((item, i) => (
                    <div className="row" key={i}>
                        <span className="dot" style={{ background: item.color }} />
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
