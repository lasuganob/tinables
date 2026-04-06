import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDataContext } from "../context/AppDataContext";
import { useAppFeedbackContext } from "../context/AppDataContext";
import { useAppFiltersContext } from "../context/AppFiltersContext";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { fallbackAccountTypes } from "../constants/defaults";
import { formatCurrency, formatDate } from "../lib/format";
import { RecentTransactionsSection } from "../sections/RecentTransactionsSection";
import { postData } from "../api/googleSheets";
import { DialogTitleWithClose } from "../components/DialogTitleWithClose";

export function TransactionsPage() {
  const {
    transactions,
    categories,
    tags,
    users,
    accounts,
    accountTypes,
    upcomingPayments,
    isLoading,
    handleDelete,
    saveTransactionLocally,
    saveUpcomingPaymentLocally,
  } = useAppDataContext();

  const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
  const { selectedUser, dateFilter, toPickerValue, isFilterLoading } =
    useAppFiltersContext();

  const feedback = { setError, setMessage, setIsSaving };
  const navigate = useNavigate();
  const location = useLocation();
  const [showSalaryAllocatorDialog, setShowSalaryAllocatorDialog] = useState(false);
  const [pendingSalaryAllocatorPayload, setPendingSalaryAllocatorPayload] = useState(null);
  const [transactionEditorTrigger, setTransactionEditorTrigger] = useState(0);

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
    categories,
    saveTransactionLocally,
    ...feedback,
  });

  useEffect(() => {
    const prefill = location.state?.transactionPrefill;

    if (!prefill) {
      return;
    }

    setTransactionForm((current) => ({
      ...current,
      ...prefill,
      amount: String(prefill.amount ?? current.amount ?? ""),
      category_id: String(prefill.category_id ?? current.category_id ?? ""),
      account_id: String(prefill.account_id ?? current.account_id ?? ""),
      user: String(prefill.user ?? current.user ?? ""),
      tags: Array.isArray(prefill.tags) ? prefill.tags : current.tags,
      upcomingPaymentId: String(prefill.upcomingPaymentId ?? "")
    }));
    setTransactionEditorTrigger((current) => current + 1);

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, setTransactionForm]);

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

  async function handleTransactionSubmitWithSideEffects() {
    const result = await handleTransactionSubmit();

    if (!result?.ok) {
      return result;
    }

    if (result.upcomingPaymentId) {
      try {
        await postData("markUpcomingPaymentPaid", {
          id: result.upcomingPaymentId,
          status: "paid"
        });
        const existingPayment = upcomingPayments.find(
          (item) => String(item.id) === String(result.upcomingPaymentId)
        );
        if (existingPayment) {
          saveUpcomingPaymentLocally({
            ...existingPayment,
            status: "paid"
          });
        }
      } catch (error) {
        setError(error.message);
      }
    }

    if (result.isSalaryTransaction) {
      setPendingSalaryAllocatorPayload({
        amount: result.salaryAmount,
        user: result.salaryUser,
        transactionId: result.transactionId
      });
      setShowSalaryAllocatorDialog(true);
    }

    return result;
  }

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
        handleTransactionSubmit={handleTransactionSubmitWithSideEffects}
        resetTransactionForm={resetTransactionForm}
        handleDelete={handleDelete}
        toPickerValue={toPickerValue}
        visibleTransactions={visibleTransactions}
        maxId={maxTransactionId}
        transactionEditorTrigger={transactionEditorTrigger}
      />

      <Dialog
        open={showSalaryAllocatorDialog}
        onClose={() => setShowSalaryAllocatorDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitleWithClose onClose={() => setShowSalaryAllocatorDialog(false)}>
          Salary Added
        </DialogTitleWithClose>
        <DialogContent>
          <Typography>
            You added your salary. View breakdown?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSalaryAllocatorDialog(false)}>
            No
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowSalaryAllocatorDialog(false);
              navigate("/salary-allocator", {
                state: {
                  salaryAllocatorInput: {
                    amount: pendingSalaryAllocatorPayload?.amount || 0,
                    user: pendingSalaryAllocatorPayload?.user || "",
                    sourceTransactionId: pendingSalaryAllocatorPayload?.transactionId || ""
                  }
                }
              });
            }}
            sx={{
              bgcolor: "#4a6555",
              "&:hover": {
                bgcolor: "#3f594b"
              }
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
