import { Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { formatCurrency, formatDate } from "../../lib/format";
import {
  GOAL_TYPE_META,
  clamp,
  daysLeft,
  getGoalInsight,
  getGoalProgressColor,
} from "./helpers";
import { InsightChip } from "./InsightChip";

function GoalProgressBar({ goal }) {
  const pct =
    Number(goal.target_amount || 0) > 0
      ? (Number(goal.current_amount || 0) / Number(goal.target_amount || 0)) * 100
      : 0;
  const clamped = clamp(pct);
  const color = getGoalProgressColor(goal);

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
          {formatCurrency(goal.current_amount)} saved
        </Typography>
        <Typography variant="caption" color="text.secondary">
          of {formatCurrency(goal.target_amount)}
        </Typography>
      </Stack>
    </Stack>
  );
}

export function GoalCard({ goal, onAddGoal, onEditGoal }) {
  if (!goal) {
    return (
      <Card
        elevation={0}
        onClick={onAddGoal}
        sx={{
          border: "2px dashed",
          borderColor: "divider",
          cursor: "pointer",
          minHeight: 180,
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
            Add Goal
          </Typography>
        </Stack>
      </Card>
    );
  }

  const insight = getGoalInsight(goal);
  const typeMeta = GOAL_TYPE_META[goal.type] || GOAL_TYPE_META.savings;
  const pct =
    Number(goal.target_amount || 0) > 0
      ? (Number(goal.current_amount || 0) / Number(goal.target_amount || 0)) * 100
      : 0;
  const days = daysLeft(goal.target_date);

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
      onClick={() => onEditGoal(goal)}
    >
      <CardContent sx={{ p: { xs: 1.75, sm: 2 }, "&:last-child": { pb: { xs: 1.75, sm: 2 } } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Stack spacing={0.25}>
              <Typography fontWeight={700} fontSize={{ xs: "0.95rem", sm: "1rem" }}>
                {goal.name}
              </Typography>
              <Chip
                size="small"
                icon={<typeMeta.Icon sx={{ fontSize: "0.85rem !important" }} />}
                label={typeMeta.label}
                color={typeMeta.color}
                variant="outlined"
                sx={{ alignSelf: "flex-start", fontWeight: 600, fontSize: "0.7rem", height: 22 }}
              />
            </Stack>
            <InsightChip tone={insight.tone} label={insight.label} />
          </Stack>

          <GoalProgressBar goal={goal} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" fontWeight={700} color="text.primary">
              {clamp(pct, 0, 100).toFixed(0)}% complete
            </Typography>
            {days !== null && (
              <Typography variant="caption" color="text.secondary">
                {days > 0
                  ? `Target: ${formatDate(goal.target_date)}`
                  : days === 0
                    ? "Due today"
                    : "Past target date"}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
