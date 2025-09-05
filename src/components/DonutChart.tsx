import { useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import type { Shareholder } from '../types';
import { DEFAULT_COLORS, WIDTH, HEIGHT, INNER, OUTER } from '../const';
import DonutLegend from './DonutLegend';
import DonutTooltip from './DonutTooltip';
import { useDonutPlacement } from '../hooks/useDonutPlacement';

interface DonutChartProps {
    data: Shareholder[];
    withCard?: boolean;
}

export default function DonutChart({ data, withCard = true }: DonutChartProps) {
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
            start += sweep;
            return { mid };
        });
    }, [chartData]);

    const { activeIndex, tipItem, placement, refs, handlers } = useDonutPlacement(chartData, sectorAngles);

    const inner = (
        <div className="chart-content">
            <div className="pie-box" ref={refs.pieRef} aria-label="Донат-диаграмма">
                <PieChart width={WIDTH} height={HEIGHT}>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        cx={WIDTH / 2}
                        cy={HEIGHT / 2}
                        innerRadius={INNER}
                        outerRadius={OUTER}
                        paddingAngle={1}
                        onMouseEnter={(s, i) => handlers.handleEnterMove(s, i)}
                        onMouseMove={(s, i) => handlers.handleEnterMove(s, i)}
                        onMouseLeave={handlers.handleLeave}
                        onTouchStart={handlers.handleTouchStart}
                        onClick={handlers.handleClick}
                        isAnimationActive={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={index}
                                fill={entry.color}
                                stroke="#fff"
                                strokeWidth={activeIndex === index ? 3 : 1}
                                fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.25}
                                style={{ cursor: 'pointer', transition: 'fill-opacity .25s, stroke-width .25s' }}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </div>

            <DonutLegend
                items={chartData.map(({ name, color }) => ({ name, color }))}
                activeIndex={activeIndex}
                onEnter={handlers.legendEnter}
                onLeave={handlers.legendLeave}
                onTouch={handlers.legendTouch}
                onClick={handlers.legendClick}
            />

            {placement && tipItem && (
                <DonutTooltip
                    ref={refs.tipRef}
                    title={tipItem.name}
                    value={tipItem.value}
                    x={placement.x}
                    y={placement.y}
                    transform={placement.transform}
                    placement={placement.placement}
                />
            )}
        </div>
    );

    return withCard ? <div className="chart-card" ref={refs.cardRef}>{inner}</div> : inner;
}
