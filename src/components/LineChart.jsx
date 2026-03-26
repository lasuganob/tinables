export function LineChart({ data }) {
    if (!data.length) {
        return <div className="chart-empty">No transactions yet.</div>;
    }

    const width = 720;
    const height = 240;
    const padding = 24;
    const maxValue = Math.max(...data.flatMap((entry) => [entry.income, entry.expense]), 1);
    const stepX = data.length === 1 ? 0 : (width - padding * 2) / (data.length - 1);

    const toPoint = (value, index) => {
        const x = padding + index * stepX;
        const y = height - padding - (value / maxValue) * (height - padding * 2);
        return `${x},${y}`;
    };

    const incomePoints = data.map((entry, index) => toPoint(entry.income, index)).join(" ");
    const expensePoints = data.map((entry, index) => toPoint(entry.expense, index)).join(" ");

    return (
        <div className="chart-shell">
            <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" role="img" aria-label="Cashflow over time">
                <polyline points={incomePoints} className="line-chart__income" />
                <polyline points={expensePoints} className="line-chart__expense" />
                {data.map((entry, index) => {
                    const [incomeX, incomeY] = toPoint(entry.income, index).split(",");
                    const [expenseX, expenseY] = toPoint(entry.expense, index).split(",");

                    return (
                        <g key={entry.date}>
                            <circle cx={incomeX} cy={incomeY} r="4" className="line-chart__income-point" />
                            <circle cx={expenseX} cy={expenseY} r="4" className="line-chart__expense-point" />
                        </g>
                    );
                })}
            </svg>
            <div className="chart-legend">
                <span><i className="legend-dot legend-dot--income" />Income</span>
                <span><i className="legend-dot legend-dot--expense" />Expense</span>
            </div>
            <div className="chart-axis">
                {data.map((entry) => (
                    <span key={entry.date}>
                        {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                ))}
            </div>
        </div>
    );
}
