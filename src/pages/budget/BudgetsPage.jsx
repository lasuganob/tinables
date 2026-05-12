import { useMemo, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { postData } from "../../api/googleSheets";
import { BudgetEditorDialog } from "./BudgetEditorDialog";
import { GoalEditorDialog } from "./GoalEditorDialog";
import { useAppDataContext } from "../../context/AppDataContext";
import { BudgetSummaryCards } from "./BudgetSummaryCards";
import { BudgetTabs } from "./BudgetTabs";

export function BudgetsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const {
    budgets,
    goals,
    categories,
    transactions,
    saveBudgetLocally,
    saveGoalLocally,
    users,
  } = useAppDataContext();

  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category.name])),
    [categories],
  );

  const enrichedBudgets = useMemo(() => {
    return budgets.map((budget) => {
      const periodStart = budget.period_start || "";
      const periodEnd = budget.period_end || "";
      const categoryId = String(budget.category_id || "");
      const spent = transactions.reduce((sum, transaction) => {
        if (String(transaction.type || "") !== "expense") return sum;
        if (String(transaction.category_id || "") !== categoryId) return sum;

        const date = String(transaction.date || "");
        if (periodStart && date < periodStart) return sum;
        if (periodEnd && date > periodEnd) return sum;

        return sum + Number(transaction.amount || 0);
      }, 0);

      return {
        ...budget,
        spent_amount: spent,
        category_name: categoryNameById.get(categoryId) || categoryId,
      };
    });
  }, [budgets, categoryNameById, transactions]);

  const totalBudget = useMemo(
    () => enrichedBudgets.reduce((sum, budget) => sum + Number(budget.budget_amount || 0), 0),
    [enrichedBudgets],
  );
  const totalSpent = useMemo(
    () => enrichedBudgets.reduce((sum, budget) => sum + Number(budget.spent_amount || 0), 0),
    [enrichedBudgets],
  );
  const totalRemaining = totalBudget - totalSpent;

  function handleAddBudget() {
    setEditingBudget(null);
    setBudgetDialogOpen(true);
  }

  function handleEditBudget(budget) {
    setEditingBudget(budget);
    setBudgetDialogOpen(true);
  }

  function handleAddGoal() {
    setEditingGoal(null);
    setGoalDialogOpen(true);
  }

  function handleEditGoal(goal) {
    setEditingGoal(goal);
    setGoalDialogOpen(true);
  }

  async function handleSaveBudget(formData) {
    setIsSaving(true);
    try {
      const action = formData.id ? "updateBudget" : "addBudget";
      const payload = {
        ...formData,
        user: formData.user || (users?.length ? users[0].name : "System"),
      };
      const response = await postData(action, payload);
      const savedValues = { ...(response || {}) };
      delete savedValues.success;
      saveBudgetLocally({
        ...payload,
        ...savedValues,
        id: response?.id ?? payload.id,
      });
      setBudgetDialogOpen(false);
    } catch (err) {
      console.error("Failed to save budget:", err);
      alert("Failed to save budget. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveGoal(formData) {
    setIsSaving(true);
    try {
      const action = formData.id ? "updateGoal" : "addGoal";
      const payload = {
        ...formData,
        user: formData.user || (users?.length ? users[0].name : "System"),
      };
      const response = await postData(action, payload);
      const savedValues = { ...(response || {}) };
      delete savedValues.success;
      saveGoalLocally({
        ...payload,
        ...savedValues,
        id: response?.id ?? payload.id,
      });
      setGoalDialogOpen(false);
    } catch (err) {
      console.error("Failed to save goal:", err);
      alert("Failed to save goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ fontSize: { xs: "1.35rem", sm: "1.7rem" } }}
        >
          Budgets &amp; Goals
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}
        >
          Plan your spending and track progress toward your financial goals.
        </Typography>
      </Stack>

      <BudgetSummaryCards
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        totalRemaining={totalRemaining}
      />

      <BudgetTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        budgets={enrichedBudgets}
        goals={goals}
        onAddBudget={handleAddBudget}
        onEditBudget={handleEditBudget}
        onAddGoal={handleAddGoal}
        onEditGoal={handleEditGoal}
      />

      <BudgetEditorDialog
        open={budgetDialogOpen}
        onClose={() => setBudgetDialogOpen(false)}
        onSave={handleSaveBudget}
        isSaving={isSaving}
        categories={categories}
        budget={editingBudget}
      />

      <GoalEditorDialog
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        onSave={handleSaveGoal}
        isSaving={isSaving}
        goal={editingGoal}
      />
    </Stack>
  );
}
