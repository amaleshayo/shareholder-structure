import { useMemo, useRef, useState } from 'react';
import type { HoverGeom } from '../types';
import {
    WIDTH, HEIGHT, INNER, OUTER,
    TOOLTIP_ARROW, VIEWPORT_PAD, TIP_FALLBACK_W, TIP_FALLBACK_H,
} from '../const';

type TapPos = { x: number; y: number } | null;

function useIsTouch(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0;
}

export function useDonutPlacement<T extends { name: string; value: number; color: string }>(
    chartData: T[],
    sectorAngles: { mid: number }[]
) {
    const isTouch = useIsTouch();

    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [geom, setGeom] = useState<HoverGeom | null>(null);
    const [tapPos, setTapPos] = useState<TapPos>(null);

    const pieRef = useRef<HTMLDivElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const tipRef = useRef<HTMLDivElement | null>(null);

    const tipItem = useMemo(() => (activeIndex != null ? chartData[activeIndex] : null), [activeIndex, chartData]);

    const getCardEl = (): HTMLElement | null =>
        (cardRef.current as HTMLElement | null) ||
        (pieRef.current?.closest('.chart-card') as HTMLElement | null);

    const localPosInPie = (clientX: number, clientY: number) => {
        const el = pieRef.current;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: clientX - r.left, y: clientY - r.top };
    };

    const pieToCard = (px: number, py: number) => {
        const pieEl = pieRef.current;
        const cardEl = getCardEl();
        if (!pieEl || !cardEl) return { x: px, y: py };
        const pr = pieEl.getBoundingClientRect();
        const cr = cardEl.getBoundingClientRect();
        return { x: (pr.left - cr.left) + px, y: (pr.top - cr.top) + py };
    };

    const anchorInPie = () => {
        if (tapPos) return tapPos;
        if (!geom) return null;
        const ang = (-geom.midAngle) * Math.PI / 180;
        const r = (geom.inner + geom.outer) / 2 - 8;
        return { x: geom.cx + Math.cos(ang) * r, y: geom.cy + Math.sin(ang) * r };
    };

    function placeTooltip(idx: number, s: any) {
        setActiveIndex(idx);
        setGeom({
            idx,
            cx: Number(s.cx!),
            cy: Number(s.cy!),
            inner: Number(s.innerRadius!),
            outer: Number(s.outerRadius!),
            midAngle: Number((s as any).midAngle!),
        });
    }

    const clearHover = () => {
        setActiveIndex(null);
        setGeom(null);
    };

    const computeTipPlacement = () => {
        if (activeIndex == null) return null;
        const aPie = anchorInPie();
        const cardEl = getCardEl();
        if (!aPie || !cardEl) return null;

        const aCard = pieToCard(aPie.x, aPie.y);
        const cr = cardEl.getBoundingClientRect();

        if (!tapPos) {
            return {
                x: aCard.x,
                y: aCard.y,
                transform: `translate(-50%, -100%) translateY(-${TOOLTIP_ARROW}px)`,
                placement: 'top' as const,
            };
        }

        const tw = tipRef.current?.offsetWidth ?? TIP_FALLBACK_W;
        const th = tipRef.current?.offsetHeight ?? TIP_FALLBACK_H;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let xAbs = cr.left + aCard.x;
        let yAbs = cr.top + aCard.y;

        const enoughTop = yAbs >= th + TOOLTIP_ARROW + 4;
        let useTop = enoughTop;

        let cxAbs = xAbs;
        let cyAbs = useTop ? yAbs - TOOLTIP_ARROW : yAbs + TOOLTIP_ARROW;

        const minX = VIEWPORT_PAD + tw / 2;
        const maxX = vw - VIEWPORT_PAD - tw / 2;
        if (cxAbs < minX) cxAbs = minX;
        if (cxAbs > maxX) cxAbs = maxX;

        if (useTop && cyAbs - th < VIEWPORT_PAD) {
            useTop = false;
            cyAbs = Math.min(vh - VIEWPORT_PAD - th, yAbs + TOOLTIP_ARROW);
        } else if (!useTop && cyAbs + th > vh - VIEWPORT_PAD) {
            cyAbs = vh - VIEWPORT_PAD - th;
        }

        return {
            x: cxAbs - cr.left,
            y: cyAbs - cr.top,
            transform: useTop
                ? `translate(-50%, -100%) translateY(-${TOOLTIP_ARROW}px)`
                : `translate(-50%, 0) translateY(${TOOLTIP_ARROW}px)`,
            placement: useTop ? ('top' as const) : ('bottom' as const),
        };
    };

    const handleEnterMove = (s: any, i: number) => {
        if (!isTouch) placeTooltip(i, s);
    };
    const handleLeave = () => {
        if (!isTouch) clearHover();
    };
    const handleTouchStart = (s: any, i: number, e: any) => {
        const t = e?.touches?.[0] || e?.changedTouches?.[0];
        if (t) {
            const p = localPosInPie(t.clientX, t.clientY);
            if (p) setTapPos(p);
        }
        placeTooltip(i, s);
    };
    const handleClick = (s: any, i: number, e: any) => {
        const p = e?.clientX != null ? localPosInPie(e.clientX, e.clientY) : null;
        if (p) setTapPos(p);
        placeTooltip(i, s);
    };

    const legendEnter = (i: number) => {
        if (isTouch) return;
        const { mid } = sectorAngles[i];
        placeTooltip(i, { cx: WIDTH / 2, cy: HEIGHT / 2, innerRadius: INNER, outerRadius: OUTER, midAngle: mid });
    };
    const legendLeave = () => { if (!isTouch) clearHover(); };
    const legendTouch = (i: number) => {
        const { mid } = sectorAngles[i];
        setTapPos({ x: WIDTH / 2, y: HEIGHT / 2 });
        placeTooltip(i, { cx: WIDTH / 2, cy: HEIGHT / 2, innerRadius: INNER, outerRadius: OUTER, midAngle: mid });
    };
    const legendClick = (i: number) => legendTouch(i);

    return {
        isTouch,
        activeIndex,
        tipItem,
        placement: computeTipPlacement(),
        refs: { pieRef, cardRef, tipRef },
        handlers: {
            handleEnterMove,
            handleLeave,
            handleTouchStart,
            handleClick,
            legendEnter,
            legendLeave,
            legendTouch,
            legendClick,
        },
    };
}
