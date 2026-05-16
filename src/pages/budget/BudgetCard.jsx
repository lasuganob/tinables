import { Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { formatCurrency, formatDate } from "../../lib/format";
import {
  clamp,
  daysLeft,
  getBudgetInsight,
  getBudgetProgressColor,
} from "./helpers";
import { InsightChip } from "./InsightChip";

function formatPeriodLabel(budget) {
  const start = budget.period_start ? formatDate(budget.period_start) : "";
  const end = budget.period_end ? formatDate(budget.period_end) : "";

  if (start && end) return `${start} - ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "";
}

function BudgetProgressBar({ budget }) {
  const pct =
    Number(budget.budget_amount || 0) > 0
      ? (Number(budget.spent_amount || 0) / Number(budget.budget_amount || 0)) * 100
      : 0;
  const clamped = clamp(pct);
  const color = getBudgetProgressColor(budget);

  return (
    <Stack spacing={0.5}>
      <LinearProgress
        variant="determinate"
        value={clamped}
        color={color}
        sx={{ borderRadius: 99, height: 8 }}
      />
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {formatCurrency(budget.spent_amount)} spent
        </Typography>
        <Typography variant="caption" color="text.secondary">
          of {formatCurrency(budget.budget_amount)}
        </Typography>
      </Stack>
    </Stack>
  );
}

export function BudgetCard({ budget, onAddBudget, onEditBudget }) {
  if (!budget) {
    return (
      <Card
        elevation={0}
        onClick={onAddBudget}
        sx={{
          border: "2px dashed",
          borderColor: "divider",
          cursor: "pointer",
          minHeight: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.2s, background 0.2s",
          "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <AddRoundedIcon sx={{ color: "text.disabled", fontSize: 32 }} />
          <Typography fontWeight={600} color="text.secondary">
            Add Budget
          </Typography>
        </Stack>
      </Card>
    );
  }

  const insight = getBudgetInsight(budget);
  const remaining = Number(budget.budget_amount || 0) - Number(budget.spent_amount || 0);
  const days = daysLeft(budget.period_end);
  const periodLabel = formatPeriodLabel(budget);

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        },
      }}
      onClick={() => onEditBudget(budget)}
    >
      <CardContent sx={{ p: { xs: 1.75, sm: 2 }, "&:last-child": { pb: { xs: 1.75, sm: 2 } } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} fontSize={{ xs: "0.95rem", sm: "1rem" }}>
                {budget.category_name || budget.category_id}
              </Typography>
              {periodLabel ? (
                <Typography variant="caption" color="text.secondary">
                  {periodLabel}
                </Typography>
              ) : null}
            </Stack>
            <InsightChip tone={insight.tone} label={insight.label} />
          </Stack>

          <BudgetProgressBar budget={budget} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" fontWeight={600} color={remaining < 0 ? "error.main" : "text.primary"}>
              {remaining < 0
                ? `${formatCurrency(Math.abs(remaining))} over`
                : `${formatCurrency(remaining)} left`}
            </Typography>
            {days !== null && (
              <Typography variant="caption" color="text.secondary">
                {days > 0 ? `${days}d remaining` : days === 0 ? "Ends today" : "Period ended"}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
