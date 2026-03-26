export function StatCard({ label, value, tone = "neutral" }) {
    return (
        <article className={`stat-card stat-card--${tone}`}>
            <span>{label}</span>
            <strong>{value}</strong>
        </article>
    );
}
