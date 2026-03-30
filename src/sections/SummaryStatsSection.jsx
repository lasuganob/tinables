import { Box, Card, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { StatCard } from "../components/StatCard";
import { formatCurrency } from "../lib/format";
import { SectionSkeleton } from "../components/Skeletons";

export function SummaryStatsSection({ isViewLoading, accountsTotal, expenseTotal, balance, incomeBreakdown, users }) {
    const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

    function getUsername(userId) {
        return users.find((user) => String(user.id) === String(userId))?.name || "Unknown";
    }

    return (
        <>
            <Box
                sx={{
                    display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "1.1fr 1fr 1fr" },
                    "& > :nth-of-type(3)": {
                        gridColumn: { xs: "1 / -1", md: "auto" }
                    }
                }}>
                {isViewLoading ? (
                    <>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}><SectionSkeleton lines={2} /></Card>
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
                        <StatCard label="Expenses" value={formatCurrency(expenseTotal)} tone="expense" />
                        <StatCard label="Balance" value={formatCurrency(balance)} tone={balance >= 0 ? "income" : "neutral"} />
                    </>
                )}
            </Box>

            <Dialog open={showIncomeBreakdown} onClose={() => setShowIncomeBreakdown(false)} fullWidth maxWidth="sm">
                <DialogTitle>Income Breakdown By Account</DialogTitle>
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
                            <Typography color="text.secondary">No income data found for the current filter.</Typography>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
