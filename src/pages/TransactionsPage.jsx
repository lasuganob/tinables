import { useMemo } from "react";
import { Stack, Typography } from "@mui/material";
import { useAppDataContext } from "../context/AppDataContext";
import { useAppFeedbackContext } from "../context/AppDataContext";
import { useAppFiltersContext } from "../context/AppFiltersContext";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { fallbackAccountTypes } from "../constants/defaults";
import { formatCurrency, formatDate } from "../lib/format";
import { RecentTransactionsSection } from "../sections/RecentTransactionsSection";

export function TransactionsPage() {
  const {
    transactions,
    categories,
    tags,
    users,
    accounts,
    accountTypes,
    isLoading,
    handleDelete,
    saveTransactionLocally,
  } = useAppDataContext();

  const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
  const { selectedUser, dateFilter, toPickerValue, isFilterLoading } =
    useAppFiltersContext();

  const feedback = { setError, setMessage, setIsSaving };

  const isViewLoading = isLoading || isFilterLoading;

  const {
    transactionForm,
    setTransactionForm,
    handleTransactionSubmit,
    resetTransactionForm,
  } = useTransactionForm({
    selectedUser,
    users,
    transactions,
    accounts,
    saveTransactionLocally,
    ...feedback,
  });

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

  const userNameById = useMemo(
    () => new Map(users.map((u) => [String(u.id), u.name])),
    [users],
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          String(c.type || "")
            .trim()
            .toLowerCase() ===
          String(transactionForm.type || "")
            .trim()
            .toLowerCase(),
      ),
    [categories, transactionForm.type],
  );

  const visibleTransactions = useMemo(() => {
    const userScoped = selectedUser
      ? transactions.filter((t) => t.user === selectedUser)
      : transactions;

    return userScoped.filter((t) => {
      const d = String(t.date || "");
      if (dateFilter.mode === "month" && dateFilter.month)
        return d.slice(0, 7) === dateFilter.month;
      if (dateFilter.mode === "year" && dateFilter.year)
        return d.slice(0, 4) === dateFilter.year;
      if (dateFilter.mode === "range") {
        if (dateFilter.startDate && d < dateFilter.startDate) return false;
        if (dateFilter.endDate && d > dateFilter.endDate) return false;
      }
      return true;
    });
  }, [dateFilter, selectedUser, transactions]);

  const maxTransactionId = useMemo(
    () => transactions.reduce((max, t) => Math.max(max, t.id), 0),
    [transactions],
  );

  const transactionFormTagIds = useMemo(
    () =>
      (transactionForm.tags || []).map((tagValue) => {
        const directId = String(tagValue);
        if (tagNameById.has(directId)) return directId;
        const matched = tags.find((tag) => tag.name === tagValue);
        return matched ? String(matched.id) : directId;
      }),
    [transactionForm.tags, tagNameById, tags],
  );

  const availableAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (
        Number(account.is_active) !== 1 &&
        String(account.id) !== String(transactionForm.account_id) &&
        String(account.id) !== String(transactionForm.transfer_account_id)
      ) {
        return false;
      }
      if (!selectedUser) return true;
      const owner = userNameById.get(String(account.user)) || "";
      return !account.user || owner === selectedUser;
    });
  }, [accounts, selectedUser, transactionForm.account_id, transactionForm.transfer_account_id, userNameById]);

  const accountTypeOptions = useMemo(
    () => (accountTypes.length ? accountTypes : fallbackAccountTypes),
    [accountTypes],
  );

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
        transactionForm={transactionForm}
        setTransactionForm={setTransactionForm}
        isSaving={isSaving}
        filteredCategories={filteredCategories}
        accounts={availableAccounts}
        accountTypes={accountTypeOptions}
        users={users}
        transactionFormTagIds={transactionFormTagIds}
        tags={tags}
        handleTransactionSubmit={handleTransactionSubmit}
        resetTransactionForm={resetTransactionForm}
        handleDelete={handleDelete}
        toPickerValue={toPickerValue}
        visibleTransactions={visibleTransactions}
        maxId={maxTransactionId}
      />
    </Stack>
  );
}
