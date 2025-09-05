import { useState, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import type { Shareholder, HoverGeom } from '../types';
import { DEFAULT_COLORS, HEIGHT, INNER, WIDTH, OUTER } from "../const.ts";

interface DonutChartProps {
    data: Shareholder[];
    withCard?: boolean;
}

type TapPos = { x: number; y: number } | null;

export default function DonutChart({ data, withCard = true }: DonutChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [hoverGeom, setHoverGeom] = useState<HoverGeom | null>(null);

    const [tapPos, setTapPos] = useState<TapPos>(null);
    const pieRef = useRef<HTMLDivElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const ARROW = 5.656;

    const isTouchDevice =
        typeof window !== 'undefined' &&
        (('ontouchstart' in window) || (navigator as any).maxTouchPoints > 0);

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

    const getCardEl = (): HTMLElement | null =>
        (cardRef.current as HTMLElement | null) ||
        (pieRef.current?.closest('.chart-card') as HTMLElement | null);

    const localPosInPie = (clientX: number, clientY: number) => {
        const el = pieRef.current;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const pieToCard = (px: number, py: number) => {
        const pieEl = pieRef.current;
        const cardEl = getCardEl();
        if (!pieEl || !cardEl) return { x: px, y: py };
        const pr = pieEl.getBoundingClientRect();
        const cr = cardEl.getBoundingClientRect();
        return { x: (pr.left - cr.left) + px, y: (pr.top - cr.top) + py };
    };

    const getAnchorInPie = () => {
        if (tapPos) return tapPos;
        if (!hoverGeom) return null;
        const { cx, cy, inner, outer, midAngle } = hoverGeom;
        const ang = (-midAngle) * Math.PI / 180;
        const r = (inner + outer) / 2 - 8;
        return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
    };

    const getTooltipPlacement = () => {
        if (activeIndex == null) return null;
        const anchorPie = getAnchorInPie();
        const cardEl = getCardEl();
        if (!anchorPie || !cardEl) return null;

        const anchorCard = pieToCard(anchorPie.x, anchorPie.y);
        const cr = cardEl.getBoundingClientRect();

        if (!tapPos) {
            return {
                x: anchorCard.x,
                y: anchorCard.y,
                transform: `translate(-50%, -100%) translateY(-${ARROW}px)`,
            };
        }

        const tw = tooltipRef.current?.offsetWidth ?? 180;
        const th = tooltipRef.current?.offsetHeight ?? 70;

        const pad = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let xAbs = cr.left + anchorCard.x;
        let yAbs = cr.top + anchorCard.y;

        const enoughTop = yAbs >= th + ARROW + 4;
        let useTop = enoughTop;

        let cxAbs = xAbs;
        let cyAbs = useTop ? yAbs - ARROW : yAbs + ARROW;

        const minXAbs = pad + tw / 2;
        const maxXAbs = vw - pad - tw / 2;
        if (cxAbs < minXAbs) cxAbs = minXAbs;
        if (cxAbs > maxXAbs) cxAbs = maxXAbs;

        if (useTop && cyAbs - th < pad) {
            useTop = false;
            cyAbs = Math.min(vh - pad - th, yAbs + ARROW);
        } else if (!useTop && cyAbs + th > vh - pad) {
            cyAbs = vh - pad - th;
        }

        const x = cxAbs - cr.left;
        const y = cyAbs - cr.top;
        const transform = useTop
            ? `translate(-50%, -100%) translateY(-${ARROW}px)`
            : `translate(-50%, 0) translateY(${ARROW}px)`;

        return { x, y, transform };
    };

    const body = (
        <div className="chart-content">
            <div className="pie-box" ref={pieRef} aria-label="Донат-диаграмма">
                <PieChart width={WIDTH} height={HEIGHT} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        cx={WIDTH / 2}
                        cy={HEIGHT / 2}
                        innerRadius={INNER}
                        outerRadius={OUTER}
                        paddingAngle={1}
                        onMouseEnter={(s, i) => !isTouchDevice && placeTooltip(i, s.cx!, s.cy!, s.innerRadius!, s.outerRadius!, (s as any).midAngle!)}
                        onMouseMove={(s, i) => !isTouchDevice && placeTooltip(i, s.cx!, s.cy!, s.innerRadius!, s.outerRadius!, (s as any).midAngle!)}
                        onMouseLeave={() => !isTouchDevice && clearHover()}
                        onTouchStart={(s, i, e: any) => {
                            const t = e?.touches?.[0] || e?.changedTouches?.[0];
                            if (t) {
                                const p = localPosInPie(t.clientX, t.clientY);
                                if (p) setTapPos(p);
                            }
                            placeTooltip(i, s.cx!, s.cy!, s.innerRadius!, s.outerRadius!, (s as any).midAngle!);
                        }}
                        onClick={(s, i, e: any) => {
                            const p = e?.clientX != null ? localPosInPie(e.clientX, e.clientY) : null;
                            if (p) setTapPos(p);
                            placeTooltip(i, s.cx!, s.cy!, s.innerRadius!, s.outerRadius!, (s as any).midAngle!);
                        }}
                        isAnimationActive={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`slice-${index}`}
                                fill={entry.color}
                                stroke="#ffffff"
                                strokeWidth={activeIndex === index ? 3 : 1}
                                fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.25}
                                style={{ cursor: 'pointer', transition: 'fill-opacity .25s, stroke-width .25s' }}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </div>

            <div className="chart-legend">
                {chartData.map((item, i) => (
                    <div
                        className="legend-row"
                        key={i}
                        onMouseEnter={() => {
                            if (isTouchDevice) return;
                            const { mid } = sectorAngles[i];
                            placeTooltip(i, WIDTH / 2, HEIGHT / 2, INNER, OUTER, mid);
                        }}
                        onMouseLeave={() => !isTouchDevice && clearHover()}
                        onTouchStart={() => {
                            const { mid } = sectorAngles[i];
                            setTapPos({ x: WIDTH / 2, y: HEIGHT / 2 });
                            placeTooltip(i, WIDTH / 2, HEIGHT / 2, INNER, OUTER, mid);
                        }}
                        onClick={() => {
                            const { mid } = sectorAngles[i];
                            setTapPos({ x: WIDTH / 2, y: HEIGHT / 2 });
                            placeTooltip(i, WIDTH / 2, HEIGHT / 2, INNER, OUTER, mid);
                        }}
                    >
            <span
                className="legend-dot"
                style={{ background: item.color, opacity: activeIndex === null ? 1 : activeIndex === i ? 1 : 0.25 }}
            />
                        <span className="legend-text">{item.name}</span>
                    </div>
                ))}
            </div>

            {(() => {
                if (activeIndex == null) return null;
                const place = getTooltipPlacement();
                if (!place) return null;
                const item = chartData[activeIndex];
                return (
                    <div
                        ref={tooltipRef}
                        className={`chart-tooltip chart-tooltip--inside ${place.transform.includes('-100%') ? 'is-top' : 'is-bottom'}`}
                        style={{
                            position: 'absolute',
                            left: place.x,
                            top: place.y,
                            transform: place.transform
                        } as React.CSSProperties}
                    >
                        <div className="chart-tooltip__title">{item.name}</div>
                        <div className="chart-tooltip__value">
                            {item.value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %
                        </div>
                    </div>
                );
            })()}
        </div>
    );

    return withCard ? (
        <div className="chart-card" ref={cardRef}>{body}</div>
    ) : (
        body
    );
}
