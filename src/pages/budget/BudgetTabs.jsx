import { Box, Stack, Tab, Tabs } from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import { BudgetCard } from "./BudgetCard";
import { GoalCard } from "./GoalCard";

export function BudgetTabs({
  activeTab,
  onTabChange,
  budgets,
  goals,
  onAddBudget,
  onEditBudget,
  onAddGoal,
  onEditGoal,
}) {
  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, value) => onTabChange(value)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2.5 }}
      >
        <Tab
          id="budgets-tab"
          aria-controls="budgets-panel"
          label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <AccountBalanceWalletRoundedIcon fontSize="small" />
              <span>Budgets</span>
            </Stack>
          }
        />
        <Tab
          id="goals-tab"
          aria-controls="goals-panel"
          label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <SavingsRoundedIcon fontSize="small" />
              <span>Goals</span>
            </Stack>
          }
        />
      </Tabs>

      {activeTab === 0 && (
        <Box
          id="budgets-panel"
          role="tabpanel"
          aria-labelledby="budgets-tab"
          sx={{
            display: "grid",
            gap: { xs: 1.5, sm: 2 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
          }}
        >
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onAddBudget={onAddBudget}
              onEditBudget={onEditBudget}
            />
          ))}
          <BudgetCard onAddBudget={onAddBudget} />
        </Box>
      )}

      {activeTab === 1 && (
        <Box
          id="goals-panel"
          role="tabpanel"
          aria-labelledby="goals-tab"
          sx={{
            display: "grid",
            gap: { xs: 1.5, sm: 2 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
          }}
        >
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddGoal={onAddGoal}
              onEditGoal={onEditGoal}
            />
          ))}
          <GoalCard onAddGoal={onAddGoal} />
        </Box>
      )}
    </Box>
  );
}
