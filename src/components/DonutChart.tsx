import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import type { Shareholder, HoverGeom } from '../types';
import {DEFAULT_COLORS, HEIGHT, INNER, WIDTH, OUTER} from "../const.ts";

interface DonutChartProps {
    data: Shareholder[];
    withCard?: boolean;
}

export default function DonutChart({ data, withCard = true }: DonutChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [hoverGeom, setHoverGeom] = useState<HoverGeom | null>(null);

    const chartData = useMemo(
        () =>
            data.map((d, i) => ({
                name: d.name,
                value: Number(d.percent.toFixed(2)),
                color: (d as any).color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            })),
        [data]
    );

    const sectorAngles = useMemo(() => {
        const total = chartData.reduce((s, d) => s + d.value, 0) || 1;
        let start = 0;
        return chartData.map((d) => {
            const sweep = (d.value / total) * 360;
            const mid = start + sweep / 2;
            const res = { start, sweep, mid };
            start += sweep;
            return res;
        });
    }, [chartData]);

    const placeTooltip = (
        idx: number, cx: number, cy: number, inner: number, outer: number, midAngleDeg: number
    ) => {
        setActiveIndex(idx);
        setHoverGeom({ idx, cx, cy, inner, outer, midAngle: midAngleDeg });
    };

    const clearHover = () => {
        setActiveIndex(null);
        setHoverGeom(null);
    };

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
                        onMouseEnter={(sector, idx) =>
                            placeTooltip(
                                idx,
                                sector.cx!, sector.cy!,
                                sector.innerRadius!, sector.outerRadius!,
                                (sector as any).midAngle!
                            )
                        }
                        onMouseMove={(sector, idx) =>
                            placeTooltip(
                                idx,
                                sector.cx!, sector.cy!,
                                sector.innerRadius!, sector.outerRadius!,
                                (sector as any).midAngle!
                            )
                        }
                        onMouseLeave={clearHover}
                        isAnimationActive={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`slice-${index}`}
                                fill={entry.color}
                                stroke="#ffffff"
                                strokeWidth={activeIndex === index ? 3 : 1}
                                fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.25}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'fill-opacity 0.25s ease-in-out, stroke-width 0.25s ease-in-out'
                                }}
                            />
                        ))}
                    </Pie>
                </PieChart>

                {hoverGeom && (() => {
                    const { cx, cy, inner, outer, midAngle } = hoverGeom;
                    const ang = (-midAngle) * (Math.PI / 180);
                    const r = (inner + outer) / 2 - 8;
                    const x = cx + Math.cos(ang) * r;
                    const y = cy + Math.sin(ang) * r;

                    const item = chartData[hoverGeom.idx];

                    return (
                        <div
                            className="chart-tooltip chart-tooltip--inside"
                            style={{
                                left: x,
                                top: y,
                                transform: 'translate(-50%, -100%) translateY(-8px)'
                            }}
                        >
                            <div className="chart-tooltip__title">{item.name}</div>
                            <div className="chart-tooltip__value">
                                {item.value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div className="chart-legend">
                {chartData.map((item, i) => (
                    <div
                        className="legend-row"
                        key={i}
                        onMouseEnter={() => {
                            const { mid } = sectorAngles[i];
                            placeTooltip(i, WIDTH / 2, HEIGHT / 2, INNER, OUTER, mid);
                        }}
                        onMouseLeave={clearHover}
                    >
            <span
                className="legend-dot"
                style={{ background: item.color, opacity: activeIndex === null ? 1 : activeIndex === i ? 1 : 0.25 }}
            />
                        <span className="legend-text">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return withCard ? <div className="chart-card">{content}</div> : content;
}
