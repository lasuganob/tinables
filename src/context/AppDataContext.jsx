import { createContext, useContext, useEffect, useMemo } from "react";
import { useAppData } from "../hooks/useAppData";
import { useAppFiltersContext } from "./AppFiltersContext";
import { useFeedback } from "../hooks/useFeedback";

const AppDataContext = createContext(null);
const AppFeedbackContext = createContext(null);

export function AppDataProvider({ onTransactionsChange, children }) {
  const { selectedUser } = useAppFiltersContext();
  const { error, setError, message, setMessage, isSaving, setIsSaving } = useFeedback();
  const feedback = { setError, setMessage, setIsSaving };

  const {
    transactions,
    categories,
    tags,
    users,
    accounts,
    accountTypes,
    salaryAllocations,
    salaryAllocationItems,
    salaryAllocationHistory,
    upcomingPayments,
    isLoading,
    refreshTransactions,
    refreshCategories,
    refreshTags,
    refreshAccounts,
    refreshSalaryAllocations,
    refreshSalaryAllocationItems,
    refreshSalaryAllocationHistory,
    refreshUpcomingPayments,
    handleDelete,
    saveCategoryLocally,
    saveTagLocally,
    saveAccountLocally,
    saveTransactionLocally,
    saveSalaryAllocationLocally,
    saveSalaryAllocationItemLocally,
    saveSalaryAllocationHistoryLocally,
    removeSalaryAllocationItemLocally,
    saveUpcomingPaymentLocally,
  } = useAppData({ selectedUser, ...feedback });

  // Keep the filter-provider bridge in sync with the authoritative transactions list.
  useEffect(() => {
    if (onTransactionsChange) {
      onTransactionsChange(transactions);
    }
  }, [transactions, onTransactionsChange]);

  const dataValue = useMemo(
    () => ({
      transactions,
      categories,
      tags,
      users,
      accounts,
      accountTypes,
      salaryAllocations,
      salaryAllocationItems,
      salaryAllocationHistory,
      upcomingPayments,
      isLoading,
      refreshTransactions,
      refreshCategories,
      refreshTags,
      refreshAccounts,
      refreshSalaryAllocations,
      refreshSalaryAllocationItems,
      refreshSalaryAllocationHistory,
      refreshUpcomingPayments,
      handleDelete,
      saveCategoryLocally,
      saveTagLocally,
      saveAccountLocally,
      saveTransactionLocally,
      saveSalaryAllocationLocally,
      saveSalaryAllocationItemLocally,
      saveSalaryAllocationHistoryLocally,
      removeSalaryAllocationItemLocally,
      saveUpcomingPaymentLocally,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      transactions,
      categories,
      tags,
      users,
      accounts,
      accountTypes,
      salaryAllocations,
      salaryAllocationItems,
      salaryAllocationHistory,
      upcomingPayments,
      isLoading,
      refreshTransactions,
      refreshCategories,
      refreshTags,
      refreshAccounts,
      refreshSalaryAllocations,
      refreshSalaryAllocationItems,
      refreshSalaryAllocationHistory,
      refreshUpcomingPayments,
      handleDelete,
      saveCategoryLocally,
      saveTagLocally,
      saveAccountLocally,
      saveTransactionLocally,
      saveSalaryAllocationLocally,
      saveSalaryAllocationItemLocally,
      saveSalaryAllocationHistoryLocally,
      removeSalaryAllocationItemLocally,
      saveUpcomingPaymentLocally,
    ],
  );

  const feedbackValue = useMemo(
    () => ({ error, setError, message, setMessage, isSaving, setIsSaving }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [error, message, isSaving],
  );

  return (
    <AppFeedbackContext.Provider value={feedbackValue}>
      <AppDataContext.Provider value={dataValue}>
        {children}
      </AppDataContext.Provider>
    </AppFeedbackContext.Provider>
  );
}

export function useAppDataContext() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppDataContext must be used within AppDataProvider");
  return ctx;
}

export function useAppFeedbackContext() {
  const ctx = useContext(AppFeedbackContext);
  if (!ctx) throw new Error("useAppFeedbackContext must be used within AppDataProvider");
  return ctx;
}
