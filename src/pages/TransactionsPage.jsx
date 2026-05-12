import { useMemo } from "react";
import { Stack, Typography } from "@mui/material";
import { useAppDataContext } from "../context/AppDataContext";
import { useAppFeedbackContext } from "../context/AppDataContext";
import { useAppFiltersContext } from "../context/AppFiltersContext";
import { formatCurrency, formatDate, isDateWithinWeek } from "../lib/format";
import { RecentTransactionsSection } from "../sections/RecentTransactionsSection";
import { useTransactionDialogContext } from "../context/TransactionDialogContext";

export function TransactionsPage() {
  const {
    transactions,
    categories,
    tags,
    accounts,
    isLoading,
    handleDelete,
  } = useAppDataContext();

  const { isSaving } = useAppFeedbackContext();
  const { selectedUser, dateFilter, isFilterLoading } =
    useAppFiltersContext();
  const { openEditTransaction } = useTransactionDialogContext();

  const isViewLoading = isLoading || isFilterLoading;

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [String(c.id), c.name])),
    [categories],
  );
  const accountNameById = useMemo(
    () => new Map(accounts.map((a) => [String(a.id), a.name])),
    [accounts],
  );
  const tagNameById = useMemo(
    () => new Map(tags.map((t) => [String(t.id), t.name])),
    [tags],
  );

  const visibleTransactions = useMemo(() => {
    const userScoped = selectedUser
      ? transactions.filter((t) => t.user === selectedUser)
      : transactions;

    return userScoped.filter((t) => {
      const d = String(t.date || "");
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
  }, [dateFilter, selectedUser, transactions]);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.35rem", sm: "1.7rem" } }}>
          Transactions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}>
          Track your income, expenses, and transfers
        </Typography>
      </Stack>

      <RecentTransactionsSection
        isViewLoading={isViewLoading}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        categoryNameById={categoryNameById}
        accountNameById={accountNameById}
        tagNameById={tagNameById}
        isSaving={isSaving}
        handleDelete={handleDelete}
        visibleTransactions={visibleTransactions}
        onEditTransaction={openEditTransaction}
      />
    </Stack>
  );
}
