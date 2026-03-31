import { Box, Card, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
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
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", xl: "1.1fr 1fr 1fr 1.2fr" }
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
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                            <Box sx={{ p: 2 }}>
                                <Stack spacing={1.5}>
                                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
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
                                                    <Typography variant="body2" color="text.secondary">
                                                        {index + 1}. {category.name}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={700}>
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
                                    <ListItemText primary={"(" + getUsername(item.user) + ") " + item.name} />
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
