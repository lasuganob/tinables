import { Box } from "@mui/material";
import { formatCurrency } from "../../lib/format";
import { BudgetKpiCard } from "./BudgetKpiCard";

export function BudgetSummaryCards({ totalBudget, totalSpent, totalRemaining }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 1.25, sm: 2 },
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
      }}
    >
      <BudgetKpiCard
        label="Total Budget"
        value={formatCurrency(totalBudget)}
        tone="neutral"
      />
      <BudgetKpiCard
        label="Total Spent"
        value={formatCurrency(totalSpent)}
        tone={totalSpent > totalBudget ? "negative" : "warning"}
      />
      <BudgetKpiCard
        label="Remaining"
        value={formatCurrency(Math.abs(totalRemaining))}
        tone={totalRemaining < 0 ? "negative" : "positive"}
      />
    </Box>
  );
}
