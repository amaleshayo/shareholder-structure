import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import type { Shareholder } from '../types';
import {DEFAULT_COLORS, HEIGHT, INNER, WIDTH, OUTER} from "../const.ts";

interface DonutChartProps {
    data: Shareholder[];
    withCard?: boolean;
}

export default function DonutChart({ data, withCard = true }: DonutChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const chartData = useMemo(
        () =>
            data.map((d, i) => ({
                name: d.name,
                value: Number(d.percent.toFixed(2)),
                color: (d as any).color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            })),
        [data]
    );

    const content = (
        <div className="chart-content">
            <div className="pie-box" aria-label="Донат-диаграмма">
                <PieChart width={WIDTH} height={HEIGHT} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        cx={WIDTH / 2}
                        cy={HEIGHT / 2}
                        innerRadius={INNER}
                        outerRadius={OUTER}
                        paddingAngle={1}
                        onMouseEnter={(_, idx) => setActiveIndex(idx)}
                        onMouseLeave={() => setActiveIndex(null)}
                        isAnimationActive={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`slice-${index}`}
                                fill={entry.color}
                                stroke="#ffffff"
                                strokeWidth={activeIndex === index ? 3 : 1}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </div>

            <div className="chart-legend">
                {chartData.map((item, i) => (
                    <div className="legend-row" key={i}>
                        <span className="legend-dot" style={{ background: item.color }} />
                        <span className="legend-text">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return withCard ? <div className="chart-card">{content}</div> : content;
}
