import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import { formatCurrency, getTodayInAppTimeZone } from "../../lib/format";

export const GOAL_TYPE_META = {
  savings: { label: "Savings", Icon: SavingsRoundedIcon, color: "primary" },
  debt_payoff: { label: "Debt Payoff", Icon: CreditCardRoundedIcon, color: "error" },
  purchase: { label: "Purchase", Icon: ShoppingCartRoundedIcon, color: "secondary" },
};

export function daysLeft(targetDate) {
  if (!targetDate) return null;

  const today = new Date(getTodayInAppTimeZone());
  const target = new Date(targetDate);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

export function getBudgetInsight(budget) {
  const budgetAmount = Number(budget.budget_amount || 0);
  const spentAmount = Number(budget.spent_amount || 0);
  const pct = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

  if (spentAmount > budgetAmount) {
    const exceeded = spentAmount - budgetAmount;
    return { label: `Exceeded by ${formatCurrency(exceeded)}`, tone: "error" };
  }

  if (pct >= 85) {
    return { label: `${pct.toFixed(0)}% used - almost at limit`, tone: "warning" };
  }

  return { label: `${pct.toFixed(0)}% used`, tone: "success" };
}

export function getBudgetProgressColor(budget) {
  const pct =
    Number(budget.budget_amount || 0) > 0
      ? (Number(budget.spent_amount || 0) / Number(budget.budget_amount || 0)) * 100
      : 0;

  if (pct > 100) return "error";
  if (pct >= 85) return "warning";
  return "success";
}

export function getGoalInsight(goal) {
  const savedAmount = Number(goal.current_amount || 0);
  const targetAmount = Number(goal.target_amount || 0);
  const monthlyRequired = Number(goal.monthly_target || 0);
  const monthlyActual = Number(goal.monthly_actual || 0);

  if (savedAmount >= targetAmount) {
    return { label: "Goal achieved!", tone: "success", Icon: CheckCircleRoundedIcon };
  }

  if (monthlyRequired > 0 && monthlyActual >= monthlyRequired) {
    return { label: "On track", tone: "success", Icon: CheckCircleRoundedIcon };
  }

  const shortfall = monthlyRequired > 0 ? monthlyRequired - monthlyActual : 0;

  if (monthlyRequired > 0 && shortfall / monthlyRequired > 0.3) {
    return {
      label: `Behind - needs ${formatCurrency(shortfall)} more/mo`,
      tone: "error",
      Icon: ErrorRoundedIcon,
    };
  }

  return { label: "On track", tone: "success", Icon: CheckCircleRoundedIcon };
}

export function getGoalProgressColor(goal) {
  const insight = getGoalInsight(goal);
  return insight.tone === "success" ? "success" : insight.tone === "error" ? "error" : "warning";
}
