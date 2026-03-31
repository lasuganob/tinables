import { Badge, Box, Card, Chip, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { StatCard } from "../components/StatCard";
import { formatCurrency } from "../lib/format";
import { SectionSkeleton } from "../components/Skeletons";

export function SummaryStatsSection({
    isViewLoading,
    accountsTotal,
    incomeTotal,
    expenseTotal,
    incomeBreakdown,
    topExpenseCategories,
    users
}) {
    const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

    function getUsername(userId) {
        return users.find((user) => String(user.id) === String(userId))?.name || "Unknown";
    }

    return (
        <>
            <Box
                sx={{
                    display: "grid",
                    gap: { xs: 1.25, sm: 2 },
                    gridTemplateColumns: { xs: "1fr 1fr", lg: "1fr 1fr 1fr", xl: "1.1fr 1fr 1fr 1.2fr" }
                }}>
                {isViewLoading ? (
                    <>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={4} /></Card>
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Accounts Summary"
                            value={formatCurrency(accountsTotal)}
                            tone="income"
                            actionLabel="View breakdown"
                            onAction={() => setShowIncomeBreakdown(true)}
                        />
                        <StatCard label="Income" value={formatCurrency(incomeTotal)} tone="income" />
                        <StatCard label="Expenses" value={formatCurrency(expenseTotal)} tone="expense" />
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", gridColumn: { xs: "1 / -1", xl: "auto" } }}>
                            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                                <Stack spacing={{ xs: 1, sm: 1.5 }}>
                                    <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" } }}>
                                        Top 3 Expense Categories
                                    </Typography>
                                    {topExpenseCategories.length ? (
                                        <Stack spacing={1}>
                                            {topExpenseCategories.map((category, index) => (
                                                <Stack
                                                    key={category.name}
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    spacing={2}
                                                    alignItems="center"
                                                >
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                                                        {index + 1}. {category.name}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                                                        {formatCurrency(category.value)}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No expense data for the current filter.
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Card>
                    </>
                )}
            </Box>

            <Dialog open={showIncomeBreakdown} onClose={() => setShowIncomeBreakdown(false)} fullWidth maxWidth="sm">
                <DialogTitle>Accounts Summary Breakdown</DialogTitle>
                <DialogContent dividers>
                    {incomeBreakdown.length ? (
                        <List disablePadding>
                            {incomeBreakdown.map((item) => (
                                <ListItem key={item.id} disableGutters>
                                    <ListItemText primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2">{item.name}</Typography>
                                            <Chip color={item.user === 1 ? "primary" : "secondary"} variant="filled" size="small" label={getUsername(item.user)} />
                                        </Box>
                                    } />
                                    <Typography fontWeight={600}>{formatCurrency(item.value)}</Typography>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Stack alignItems="center" py={2}>
                            <Typography color="text.secondary">No account data found for the current filter.</Typography>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
