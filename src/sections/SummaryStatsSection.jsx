import { Box, Card } from "@mui/material";
import { StatCard } from "../components/StatCard";
import { formatCurrency } from "../lib/format";
import { SectionSkeleton } from "../components/Skeletons";

export function SummaryStatsSection({ isViewLoading, incomeTotal, expenseTotal, balance }) {
    return (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
            {isViewLoading ? (
                <>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
                </>
            ) : (
                <>
                    <StatCard label="Income" value={formatCurrency(incomeTotal)} tone="income" />
                    <StatCard label="Expenses" value={formatCurrency(expenseTotal)} tone="expense" />
                    <StatCard label="Balance" value={formatCurrency(balance)} tone={balance >= 0 ? "income" : "neutral"} />
                </>
            )}
        </Box>
    );
}
