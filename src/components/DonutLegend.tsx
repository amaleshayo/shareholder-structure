interface LegendItem {
    name: string;
    color: string;
}

interface Props {
    items: LegendItem[];
    activeIndex: number | null;
    onEnter: (i: number) => void;
    onLeave: () => void;
    onTouch: (i: number) => void;
    onClick: (i: number) => void;
}

export default function DonutLegend({ items, activeIndex, onEnter, onLeave, onTouch, onClick }: Props) {
    return (
        <div className="chart-legend">
            {items.map((item, i) => (
                <div
                    className="legend-row"
                    key={i}
                    onMouseEnter={() => onEnter(i)}
                    onMouseLeave={onLeave}
                    onTouchStart={() => onTouch(i)}
                    onClick={() => onClick(i)}
                >
          <span
              className="legend-dot"
              style={{ background: item.color, opacity: activeIndex === null ? 1 : activeIndex === i ? 1 : 0.25 }}
          />
                    <span className="legend-text">{item.name}</span>
                </div>
            ))}
        </div>
    );
}
