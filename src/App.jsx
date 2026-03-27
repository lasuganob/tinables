import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Alert, Box, Stack, IconButton } from "@mui/material";
import { emptyCategory, emptyTag } from "./constants/defaults";
import { formatCurrency, formatDate } from "./lib/format";
import {
  totalByType,
  groupCashflow,
  groupExpenseByCategory,
} from "./utils/transactions";
import { useFeedback } from "./hooks/useFeedback";
import { useAppData } from "./hooks/useAppData";
import { useTransactionForm } from "./hooks/useTransactionForm";
import { useCategoryForm } from "./hooks/useCategoryForm";
import { useTagForm } from "./hooks/useTagForm";

import { HeaderSection } from "./sections/HeaderSection";
import { GlobalFiltersSection } from "./sections/GlobalFiltersSection";
import { SummaryStatsSection } from "./sections/SummaryStatsSection";
import { ChartsSection } from "./sections/ChartsSection";
import { RecentTransactionsSection } from "./sections/RecentTransactionsSection";
import { ManagersSection } from "./sections/ManagersSection";
import CloseIcon from "@mui/icons-material/Close";

function App() {
  const [selectedUser, setSelectedUser] = useState("");
  const [dateFilter, setDateFilter] = useState({
    mode: "month",
    month: dayjs().format("YYYY-MM"),
    year: "",
    startDate: "",
    endDate: "",
  });
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [hasInitializedDefaultMonth, setHasInitializedDefaultMonth] =
    useState(false);

  const { error, setError, message, setMessage, isSaving, setIsSaving } =
    useFeedback();
  const feedback = { setError, setMessage, setIsSaving };

  const {
    transactions,
    categories,
    tags,
    users,
    isLoading,
    refreshTransactions,
    refreshCategories,
    refreshTags,
    handleDelete,
  } = useAppData({ selectedUser, ...feedback });

  const {
    transactionForm,
    setTransactionForm,
    handleTransactionSubmit,
    resetTransactionForm,
  } = useTransactionForm({
    selectedUser,
    users,
    refreshTransactions,
    ...feedback,
  });

  const { categoryForm, setCategoryForm, handleCategorySubmit } =
    useCategoryForm({ refreshCategories, ...feedback });

  const { tagForm, setTagForm, handleTagSubmit } = useTagForm({
    refreshTags,
    ...feedback,
  });

  useEffect(() => {
    setIsFilterLoading(true);
    const timeoutId = window.setTimeout(() => setIsFilterLoading(false), 220);
    return () => window.clearTimeout(timeoutId);
  }, [
    selectedUser,
    dateFilter.mode,
    dateFilter.month,
    dateFilter.year,
    dateFilter.startDate,
    dateFilter.endDate,
  ]);

  const availableYears = useMemo(
    () =>
      [
        ...new Set(
          transactions
            .map((transaction) => String(transaction.date || "").slice(0, 4))
            .filter(Boolean),
        ),
      ].sort((left, right) => Number(right) - Number(left)),
    [transactions],
  );

  useEffect(() => {
    if (hasInitializedDefaultMonth || !transactions.length) {
      return;
    }

    const mostRecentTransaction = [...transactions].sort(
      (left, right) => new Date(right.date) - new Date(left.date),
    )[0];

    setDateFilter((current) => ({
      ...current,
      mode: "month",
      month:
        String(mostRecentTransaction?.date || "").slice(0, 7) ||
        dayjs().format("YYYY-MM"),
    }));
    setHasInitializedDefaultMonth(true);
  }, [hasInitializedDefaultMonth, transactions]);

  const visibleTransactions = useMemo(() => {
    const userScoped = selectedUser
      ? transactions.filter((transaction) => transaction.user === selectedUser)
      : transactions;

    return userScoped.filter((transaction) => {
      const transactionDate = String(transaction.date || "");

      if (dateFilter.mode === "month" && dateFilter.month) {
        return transactionDate.slice(0, 7) === dateFilter.month;
      }

      if (dateFilter.mode === "year" && dateFilter.year) {
        return transactionDate.slice(0, 4) === dateFilter.year;
      }

      if (dateFilter.mode === "range") {
        if (dateFilter.startDate && transactionDate < dateFilter.startDate) {
          return false;
        }
        if (dateFilter.endDate && transactionDate > dateFilter.endDate) {
          return false;
        }
      }

      return true;
    });
  }, [dateFilter, selectedUser, transactions]);

  const maxTransactionId = useMemo(() => {
    return transactions.reduce((max, transaction) => {
      return Math.max(max, transaction.id);
    }, 0);
  }, [transactions]);

  const lineData = useMemo(
    () => groupCashflow(visibleTransactions),
    [visibleTransactions],
  );
  const pieData = useMemo(
    () => groupExpenseByCategory(visibleTransactions, categories),
    [visibleTransactions, categories],
  );
  const incomeTotal = totalByType(visibleTransactions, "income");
  const expenseTotal = totalByType(visibleTransactions, "expense");
  const balance = incomeTotal - expenseTotal;
  const isViewLoading = isLoading || isFilterLoading;

  const categoryNameById = useMemo(
    () =>
      new Map(
        categories.map((category) => [String(category.id), category.name]),
      ),
    [categories],
  );
  const tagNameById = useMemo(
    () => new Map(tags.map((tag) => [String(tag.id), tag.name])),
    [tags],
  );
  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          String(category.type || "")
            .trim()
            .toLowerCase() ===
          String(transactionForm.type || "")
            .trim()
            .toLowerCase(),
      ),
    [categories, transactionForm.type],
  );
  const transactionFormTagIds = useMemo(
    () =>
      (transactionForm.tags || []).map((tagValue) => {
        const directId = String(tagValue);
        if (tagNameById.has(directId)) {
          return directId;
        }
        const matchedTag = tags.find((tag) => tag.name === tagValue);
        return matchedTag ? String(matchedTag.id) : directId;
      }),
    [transactionForm.tags, tagNameById, tags],
  );

  function updateDateFilter(key, value) {
    setDateFilter((current) => ({ ...current, [key]: value }));
  }

  function toPickerValue(value) {
    return value ? dayjs(value) : null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f4f7fb 0%, #eef7f5 100%)",
        py: { xs: 3, md: 5 },
      }}
    >
      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <HeaderSection />

          {error ? (
            <Alert
              variant="outlined"
              severity="error"
              sx={{ backgroundColor: "#ffcdcdff" }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError(null);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {error}
            </Alert>
          ) : null}
          {message ? (
            <Alert
              variant="outlined"
              severity="success"
              sx={{ backgroundColor: "#d4edda" }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setMessage(null);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {message}
            </Alert>
          ) : null}

          <GlobalFiltersSection
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            users={users}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            updateDateFilter={updateDateFilter}
            toPickerValue={toPickerValue}
            availableYears={availableYears}
          />

          <SummaryStatsSection
            isViewLoading={isViewLoading}
            incomeTotal={incomeTotal}
            expenseTotal={expenseTotal}
            balance={balance}
          />

          <ChartsSection
            isViewLoading={isViewLoading}
            lineData={lineData}
            pieData={pieData}
          />

          <RecentTransactionsSection
            isViewLoading={isViewLoading}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            categoryNameById={categoryNameById}
            tagNameById={tagNameById}
            transactionForm={transactionForm}
            setTransactionForm={setTransactionForm}
            isSaving={isSaving}
            filteredCategories={filteredCategories}
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

          <ManagersSection
            isViewLoading={isViewLoading}
            handleCategorySubmit={handleCategorySubmit}
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
            emptyCategory={emptyCategory}
            isSaving={isSaving}
            categories={categories}
            handleDelete={handleDelete}
            handleTagSubmit={handleTagSubmit}
            tagForm={tagForm}
            setTagForm={setTagForm}
            emptyTag={emptyTag}
            tags={tags}
          />
        </Stack>
      </Box>
    </Box>
  );
}

export default App;
