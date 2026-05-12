import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Fab,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { postData } from "../api/googleSheets";
import { DialogTitleWithClose } from "../components/DialogTitleWithClose";
import { TransactionEditor } from "../sections/RecentTransactionsSection/TransactionEditor";
import { fallbackAccountTypes } from "../constants/defaults";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { formatCurrency, formatDate } from "../lib/format";
import { useAppDataContext, useAppFeedbackContext } from "./AppDataContext";
import { useAppFiltersContext } from "./AppFiltersContext";

const TransactionDialogContext = createContext(null);

function applyTransactionPrefill(prefill) {
  return (current) => ({
    ...current,
    ...prefill,
    amount: String(prefill.amount ?? current.amount ?? ""),
    category_id: String(prefill.category_id ?? current.category_id ?? ""),
    account_id: String(prefill.account_id ?? current.account_id ?? ""),
    transfer_account_id: String(prefill.transfer_account_id ?? current.transfer_account_id ?? ""),
    source_salary_transaction_id: String(prefill.source_salary_transaction_id ?? ""),
    salary_allocation_item_id: String(prefill.salary_allocation_item_id ?? ""),
    is_salary_allocation_base: Number(prefill.is_salary_allocation_base ?? 0),
    user: String(prefill.user ?? current.user ?? ""),
    tags: Array.isArray(prefill.tags) ? prefill.tags : current.tags,
    upcomingPaymentId: String(prefill.upcomingPaymentId ?? ""),
  });
}

export function TransactionDialogProvider({ children }) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSalaryAllocatorDialog, setShowSalaryAllocatorDialog] = useState(false);
  const [pendingSalaryAllocatorPayload, setPendingSalaryAllocatorPayload] = useState(null);

  const {
    transactions,
    categories,
    tags,
    users,
    accounts,
    accountTypes,
    upcomingPayments,
    isLoading,
    saveTransactionLocally,
    saveUpcomingPaymentLocally,
  } = useAppDataContext();
  const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
  const { selectedUser, toPickerValue } = useAppFiltersContext();

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
    setError,
    setMessage,
    setIsSaving,
  });

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [String(account.id), account.name])),
    [accounts],
  );
  const tagNameById = useMemo(
    () => new Map(tags.map((tag) => [String(tag.id), tag.name])),
    [tags],
  );
  const userNameById = useMemo(
    () => new Map(users.map((user) => [String(user.id), user.name])),
    [users],
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          String(category.type || "").trim().toLowerCase() ===
          String(transactionForm.type || "").trim().toLowerCase(),
      ),
    [categories, transactionForm.type],
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
  }, [
    accounts,
    selectedUser,
    transactionForm.account_id,
    transactionForm.transfer_account_id,
    userNameById,
  ]);

  const accountTypeOptions = useMemo(
    () => (accountTypes.length ? accountTypes : fallbackAccountTypes),
    [accountTypes],
  );

  function openNewTransaction(prefill = null) {
    resetTransactionForm();
    if (prefill) {
      setTransactionForm(applyTransactionPrefill(prefill));
    }
    setIsDialogOpen(true);
  }

  function openEditTransaction(transaction) {
    if (!transaction) return;
    setTransactionForm({
      ...transaction,
      amount: String(transaction.amount ?? ""),
      transfer_fee: String(transaction.transfer_fee ?? ""),
      account_id: String(transaction.account_id ?? ""),
      transfer_account_id: String(transaction.transfer_account_id ?? ""),
      category_id: String(transaction.category_id ?? ""),
      source_salary_transaction_id: String(transaction.source_salary_transaction_id ?? ""),
      salary_allocation_item_id: String(transaction.salary_allocation_item_id ?? ""),
      upcomingPaymentId: String(transaction.upcomingPaymentId ?? ""),
      tags: Array.isArray(transaction.tags) ? transaction.tags : [],
    });
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    if (isSaving) {
      return;
    }

    setIsDialogOpen(false);
    resetTransactionForm();
  }

  async function handleTransactionSubmitWithSideEffects() {
    const result = await handleTransactionSubmit();

    if (!result?.ok) {
      return result;
    }

    setIsDialogOpen(false);

    if (result.upcomingPaymentId) {
      try {
        await postData("markUpcomingPaymentPaid", {
          id: result.upcomingPaymentId,
          status: "paid",
        });
        const existingPayment = upcomingPayments.find(
          (item) => String(item.id) === String(result.upcomingPaymentId),
        );
        if (existingPayment) {
          saveUpcomingPaymentLocally({
            ...existingPayment,
            status: "paid",
          });
        }
      } catch (error) {
        setError(error.message);
      }
    }

    if (result.isSalaryTransaction || result.isSalaryAllocationBase) {
      setPendingSalaryAllocatorPayload({
        amount: result.salaryAmount,
        user: result.salaryUser,
        transactionId: result.transactionId,
      });
      setShowSalaryAllocatorDialog(true);
    }

    return result;
  }

  useEffect(() => {
    const prefill = location.state?.transactionPrefill;

    if (!prefill) {
      return;
    }

    openNewTransaction(prefill);
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.state, navigate]);

  const value = {
    openNewTransaction,
    openEditTransaction,
  };

  return (
    <TransactionDialogContext.Provider value={value}>
      {children}

      <Fab
        color="primary"
        aria-label="Add transaction"
        onClick={() => openNewTransaction()}
        disabled={isLoading}
        sx={{
          position: "fixed",
          right: { xs: 18, sm: 24 },
          bottom: { xs: "calc(18px + env(safe-area-inset-bottom))", sm: 24 },
          zIndex: (muiTheme) => muiTheme.zIndex.speedDial,
          bgcolor: "#4a6555",
          "&:hover": { bgcolor: "#3f594b" },
        }}
      >
        <AddRoundedIcon />
      </Fab>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        fullScreen={isMobileDialog}
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitleWithClose onClose={handleCloseDialog} disabled={isSaving}>
          {transactionForm.id ? "Edit Transaction" : "Add Transaction"}
        </DialogTitleWithClose>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          <TransactionEditor
            transactionForm={transactionForm}
            setTransactionForm={setTransactionForm}
            isSaving={isSaving}
            filteredCategories={filteredCategories}
            accounts={availableAccounts}
            accountTypes={accountTypeOptions}
            users={users}
            transactionFormTagIds={transactionFormTagIds}
            tags={tags}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            accountNameById={accountNameById}
            tagNameById={tagNameById}
            toPickerValue={toPickerValue}
            allTransactions={transactions}
            allCategories={categories}
            onSubmit={handleTransactionSubmitWithSideEffects}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

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
          <Typography>You added your salary. View breakdown?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSalaryAllocatorDialog(false)}>No</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowSalaryAllocatorDialog(false);
              navigate(`/salary-allocator/${pendingSalaryAllocatorPayload?.transactionId || ""}`);
            }}
            sx={{
              bgcolor: "#4a6555",
              "&:hover": {
                bgcolor: "#3f594b",
              },
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </TransactionDialogContext.Provider>
  );
}

export function useTransactionDialogContext() {
  const ctx = useContext(TransactionDialogContext);
  if (!ctx) {
    throw new Error("useTransactionDialogContext must be used within TransactionDialogProvider");
  }
  return ctx;
}
