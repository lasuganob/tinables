import { formatCurrency } from "../lib/format";

export function PieChart({ data }) {
    if (!data.length) {
        return <div className="chart-empty">No expense data available.</div>;
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;

    const segments = data.map((item, index) => {
        const angle = (item.value / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const largeArcFlag = angle > Math.PI ? 1 : 0;
        const radius = 90;
        const center = 110;
        const x1 = center + radius * Math.cos(startAngle - Math.PI / 2);
        const y1 = center + radius * Math.sin(startAngle - Math.PI / 2);
        const x2 = center + radius * Math.cos(endAngle - Math.PI / 2);
        const y2 = center + radius * Math.sin(endAngle - Math.PI / 2);
        const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        const color = `hsl(${(index * 67) % 360} 70% 56%)`;
        startAngle = endAngle;

        return { ...item, color, path };
    });

    return (
        <div className="pie-layout">
            <svg viewBox="0 0 220 220" className="pie-chart" role="img" aria-label="Expenses by category">
                {segments.map((segment) => (
                    <path key={segment.name} d={segment.path} fill={segment.color} />
                ))}
                <circle cx="110" cy="110" r="42" fill="#fffaf0" />
            </svg>
            <div className="pie-legend">
                {segments.map((segment) => (
                    <div key={segment.name} className="pie-legend__item">
                        <span className="swatch" style={{ backgroundColor: segment.color }} />
                        <span>{segment.name}</span>
                        <strong>{formatCurrency(segment.value)}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}
