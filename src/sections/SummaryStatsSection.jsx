import { useMemo, useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Card,
    Chip,
    Dialog,
    DialogContent,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MoneyIcon from "@mui/icons-material/Money";
import SavingsIcon from "@mui/icons-material/Savings";
import { StatCard } from "../components/StatCard";
import { formatCurrency } from "../lib/format";
import { SectionSkeleton } from "../components/Skeletons";
import { fallbackAccountTypes } from "../constants/defaults";
import { DialogTitleWithClose } from "../components/DialogTitleWithClose";

export function SummaryStatsSection({
    isViewLoading,
    accountsTotal,
    incomeTotal,
    expenseTotal,
    incomeBreakdown,
    topExpenseCategories,
    users,
    accountTypes
}) {
    const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);
    const [expandedTypePanels, setExpandedTypePanels] = useState({ "1": false, "2": false, "3": true, "4": false });

    const accountTypeOptions = useMemo(
        () => (accountTypes?.length ? accountTypes : fallbackAccountTypes),
        [accountTypes]
    );

    const groupedIncomeBreakdown = useMemo(() => {
        const typeNameById = new Map(
            accountTypeOptions.map((accountType) => [String(accountType.id), accountType.name])
        );
        const groups = new Map();

        incomeBreakdown.forEach((account) => {
            const typeKey = String(account.type || "");
            const typeName = typeNameById.get(typeKey) || `Type ${typeKey}`;

            if (!groups.has(typeKey)) {
                groups.set(typeKey, {
                    typeKey,
                    typeName,
                    accounts: []
                });
            }

            groups.get(typeKey).accounts.push(account);
        });

        return [...groups.values()].sort((left, right) =>
            left.typeName.localeCompare(right.typeName)
        );
    }, [accountTypeOptions, incomeBreakdown]);

    function getUsername(userId) {
        return users.find((user) => String(user.id) === String(userId))?.name || "Unknown";
    }

    function isPanelExpanded(typeKey) {
        return expandedTypePanels[typeKey] ?? true;
    }

    function handlePanelToggle(typeKey) {
        return (_, isExpanded) => {
            setExpandedTypePanels((current) => ({
                ...current,
                [typeKey]: isExpanded
            }));
        };
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
                            storageKey="dashboard-accounts-summary-visible"
                        />
                        <StatCard
                            label="Income"
                            value={formatCurrency(incomeTotal)}
                            tone="income"
                            storageKey="dashboard-income-visible"
                        />
                        <StatCard
                            label="Expenses"
                            value={formatCurrency(expenseTotal)}
                            tone="expense"
                            storageKey="dashboard-expenses-visible"
                        />
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
                <DialogTitleWithClose onClose={() => setShowIncomeBreakdown(false)}>
                    Accounts Summary Breakdown
                </DialogTitleWithClose>
                <DialogContent dividers>
                    {groupedIncomeBreakdown.length ? (
                        <Stack spacing={1.25}>
                            {groupedIncomeBreakdown.map((group) => (
                                <Accordion
                                    key={group.typeKey}
                                    expanded={isPanelExpanded(group.typeKey)}
                                    onChange={handlePanelToggle(group.typeKey)}
                                    disableGutters
                                    elevation={0}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 1,
                                        "&:before": { display: "none" }
                                    }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{ width: "100%", pr: 1 }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {group.typeKey == "1" && <MoneyIcon />}
                                                {group.typeKey == "2" && <AccountBalanceWalletIcon />}
                                                {group.typeKey == "3" && <AccountBalanceIcon />}
                                                {group.typeKey == "4" && <SavingsIcon />}
                                                <Typography fontWeight={700} textTransform="capitalize">
                                                    {group.typeName}
                                                </Typography>
                                            </Stack>
                                            <Chip
                                                size="small"
                                                label={`${group.accounts.length} ${group.accounts.length === 1 ? "account" : "accounts"}`}
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <Stack spacing={1.25}>
                                            {group.accounts.map((item) => (
                                                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
                                                        <Stack spacing={0.75}>
                                                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                                                <Typography fontWeight={600}>{item.name}</Typography>
                                                                <Chip color={item.user === 1 ? "primary" : "secondary"} variant="filled" size="small" label={getUsername(item.user)} />
                                                            </Stack>
                                                            <Typography fontWeight={600}>{formatCurrency(item.value)}</Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
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
