import { useMemo } from "react";
import { Box, Card, Stack, Typography, Button, Chip, LinearProgress } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useAppDataContext } from "../context/AppDataContext";
import { useAppFiltersContext } from "../context/AppFiltersContext";
import { isDateWithinWeek, formatCurrency, formatDate } from "../lib/format";
import { getUpcomingPaymentStatus } from "../utils/upcomingPayments";
import { clamp, getBudgetProgressColor, getGoalProgressColor } from "../pages/budget/helpers";
import { SectionSkeleton } from "../components/Skeletons";
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

export function DashboardInsightsSection({ isViewLoading }) {
    const navigate = useNavigate();
    const { upcomingPayments, budgets, goals, transactions, categories } = useAppDataContext();
    const { dateFilter } = useAppFiltersContext();

    const categoryNameById = useMemo(
        () => new Map(categories.map((category) => [String(category.id), category.name])),
        [categories]
    );

    const filteredDues = useMemo(() => {
        const activePayments = upcomingPayments.filter(p => p.status !== "paid");
        return activePayments.filter((p) => {
            const d = String(p.due_date || "");
            if (dateFilter.mode === "month" && dateFilter.month)
                return d.slice(0, 7) === dateFilter.month;
            if (dateFilter.mode === "week" && dateFilter.week)
                return isDateWithinWeek(d, dateFilter.week);
            if (dateFilter.mode === "year" && dateFilter.year)
                return d.slice(0, 4) === dateFilter.year;
            if (dateFilter.mode === "range") {
                if (dateFilter.startDate && d < dateFilter.startDate) return false;
                if (dateFilter.endDate && d > dateFilter.endDate) return false;
            }
            return true;
        });
    }, [upcomingPayments, dateFilter]);

    const enrichedBudgets = useMemo(() => {
        return budgets.slice(0, 5).map((budget) => {
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
    }, [budgets, transactions, categoryNameById]);

    const displayGoals = useMemo(() => goals.slice(0, 5), [goals]);

    if (isViewLoading) {
        return (
            <Box sx={{ display: "grid", gap: { xs: 1.5, sm: 2 }, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" } }}>
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={5} /></Card>
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={5} /></Card>
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={5} /></Card>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "grid", gap: { xs: 1.5, sm: 2 }, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" } }}>
            {/* Upcoming Dues Card */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column" }}>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper", display: "flex", alignItems: "start", gap: "0.5rem" }}>
                    <PaymentIcon sx={{ color: "primary.main" }} />
                    <Typography variant="h6" fontSize="1.05rem" fontWeight={700}>Upcoming Dues</Typography>
                </Box>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, flexGrow: 1, bgcolor: "background.paper" }}>
                    <Stack spacing={2.5}>
                        {filteredDues.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                                No upcoming dues found.
                            </Typography>
                        ) : (
                            filteredDues.map(payment => {
                                const derivedStatus = getUpcomingPaymentStatus(payment);
                                return (
                                    <Box key={payment.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} mb={0.25}>{payment.title}</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {formatDate(payment.due_date)} • {categoryNameById.get(String(payment.category_id)) || "Uncategorized"}
                                            </Typography>
                                        </Box>
                                        <Stack alignItems="flex-end" spacing={0.5}>
                                            <Typography variant="body2" fontWeight={700}>{formatCurrency(payment.amount)}</Typography>
                                            <Chip size="small" label={derivedStatus} color={derivedStatus === 'overdue' ? 'error' : derivedStatus === 'today' ? 'warning' : 'default'} sx={{ height: 18, fontSize: '0.65rem' }} />
                                        </Stack>
                                    </Box>
                                );
                            })
                        )}
                    </Stack>
                </Box>
                <Box sx={{ p: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper", textAlign: "center" }}>
                    <Button component={RouterLink} to="/upcoming-dues" endIcon={<ChevronRightRoundedIcon />} size="small" fullWidth sx={{ textTransform: "none", color: "text.secondary", "&:hover": { bgcolor: "transparent", color: "primary.main" } }}>
                        Show more...
                    </Button>
                </Box>
            </Card>

            {/* Budgets Card */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column" }}>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "start", gap: "0.5rem", bgcolor: "background.paper" }}>
                    <AccountBalanceWalletIcon sx={{ color: "primary.main" }} />
                    <Typography variant="h6" fontSize="1.05rem" fontWeight={700}>Budget by category</Typography>
                </Box>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, flexGrow: 1, bgcolor: "background.paper" }}>
                    <Stack spacing={2.5}>
                        {enrichedBudgets.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                                No budgets configured.
                            </Typography>
                        ) : (
                            enrichedBudgets.map(budget => {
                                const pct = Number(budget.budget_amount || 0) > 0 ? (Number(budget.spent_amount || 0) / Number(budget.budget_amount || 0)) * 100 : 0;
                                const clamped = clamp(pct);
                                const color = getBudgetProgressColor(budget);
                                const remaining = Number(budget.budget_amount || 0) - Number(budget.spent_amount || 0);

                                return (
                                    <Box key={budget.id}>
                                        <Stack direction="row" justifyContent="space-between" mb={0.75}>
                                            <Typography variant="body2" fontWeight={600}>{budget.category_name || budget.category_id}</Typography>
                                            <Typography variant="caption" fontWeight={600} color={remaining < 0 ? "error.main" : "text.primary"}>
                                                {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
                                            </Typography>
                                        </Stack>
                                        <Stack spacing={0.5}>
                                            <LinearProgress variant="determinate" value={clamped} color={color} sx={{ borderRadius: 99, height: 6 }} />
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    {formatCurrency(budget.spent_amount)} spent
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    of {formatCurrency(budget.budget_amount)}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                );
                            })
                        )}
                    </Stack>
                </Box>
                <Box sx={{ p: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper", textAlign: "center" }}>
                    <Button onClick={() => navigate("/budgets", { state: { activeTab: 0 } })} endIcon={<ChevronRightRoundedIcon />} size="small" fullWidth sx={{ textTransform: "none", color: "text.secondary", "&:hover": { bgcolor: "transparent", color: "primary.main" } }}>
                        Show more...
                    </Button>
                </Box>
            </Card>

            {/* Goals Card */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column" }}>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "start", gap: "0.5rem", bgcolor: "background.paper" }}>
                    <TrackChangesIcon sx={{ color: "primary.main" }} />
                    <Typography variant="h6" fontSize="1.05rem" fontWeight={700}>Goals</Typography>
                </Box>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, flexGrow: 1, bgcolor: "background.paper" }}>
                    <Stack spacing={2.5}>
                        {displayGoals.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                                No goals configured.
                            </Typography>
                        ) : (
                            displayGoals.map(goal => {
                                const pct = Number(goal.target_amount || 0) > 0 ? (Number(goal.current_amount || 0) / Number(goal.target_amount || 0)) * 100 : 0;
                                const clamped = clamp(pct);
                                const color = getGoalProgressColor(goal);
                                
                                return (
                                    <Box key={goal.id}>
                                        <Stack direction="row" justifyContent="space-between" mb={0.75}>
                                            <Typography variant="body2" fontWeight={600}>{goal.name}</Typography>
                                            <Typography variant="caption" fontWeight={700} color="text.primary">
                                                {clamp(pct, 0, 100).toFixed(0)}%
                                            </Typography>
                                        </Stack>
                                        <Stack spacing={0.5}>
                                            <LinearProgress variant="determinate" value={clamped} color={color} sx={{ borderRadius: 99, height: 6 }} />
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    {formatCurrency(goal.current_amount)} saved
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    of {formatCurrency(goal.target_amount)}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                );
                            })
                        )}
                    </Stack>
                </Box>
                <Box sx={{ p: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper", textAlign: "center" }}>
                    <Button onClick={() => navigate("/budgets", { state: { activeTab: 1 } })} endIcon={<ChevronRightRoundedIcon />} size="small" fullWidth sx={{ textTransform: "none", color: "text.secondary", "&:hover": { bgcolor: "transparent", color: "primary.main" } }}>
                        Show more...
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}
