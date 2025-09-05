import React, { forwardRef } from 'react';

interface Props {
    title: string;
    value: number;
    x: number;
    y: number;
    transform: string;
    placement: 'top' | 'bottom';
}

const DonutTooltip = forwardRef<HTMLDivElement, Props>(
    ({ title, value, x, y, transform, placement }, ref) => (
        <div
            ref={ref}
            className={`chart-tooltip chart-tooltip--inside ${placement === 'top' ? 'is-top' : 'is-bottom'}`}
            style={{ position: 'absolute', left: x, top: y, transform } as React.CSSProperties}
        >
            <div className="chart-tooltip__title">{title}</div>
            <div className="chart-tooltip__value">
                {value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %
            </div>
        </div>
    )
);

export default DonutTooltip;
