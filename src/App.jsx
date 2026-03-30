import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Alert, Box, Stack, IconButton } from "@mui/material";
import { emptyAccount, emptyCategory, emptyTag, fallbackAccountTypes } from "./constants/defaults";
import { formatCurrency, formatDate, getCurrentMonthInAppTimeZone, parseDateValue } from "./lib/format";
import {
  totalByType,
  buildLineChartData,
  groupExpenseByCategory,
  incomeByAccount,
  computeAccountBalances,
} from "./utils/transactions";
import { useFeedback } from "./hooks/useFeedback";
import { useAppData } from "./hooks/useAppData";
import { useTransactionForm } from "./hooks/useTransactionForm";
import { useCategoryForm } from "./hooks/useCategoryForm";
import { useTagForm } from "./hooks/useTagForm";
import { useAccountForm } from "./hooks/useAccountForm";

import { HeaderSection } from "./sections/HeaderSection";
import { GlobalFiltersSection } from "./sections/GlobalFiltersSection";
import { SummaryStatsSection } from "./sections/SummaryStatsSection";
import { ChartsSection } from "./sections/ChartsSection";
import { RecentTransactionsSection } from "./sections/RecentTransactionsSection";
import { ManagersSection } from "./sections/ManagersSection";
import CloseIcon from "@mui/icons-material/Close";

function App() {
  const utilitiesSeriesTagNames = ["Rent", "Internet", "Electricity", "Water"];
  const [selectedUser, setSelectedUser] = useState("");
  const [dateFilter, setDateFilter] = useState({
    mode: "month",
    month: getCurrentMonthInAppTimeZone(),
    year: "",
    startDate: "",
    endDate: "",
  });
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [hasInitializedDefaultMonth, setHasInitializedDefaultMonth] =
    useState(false);
  const [chartCategoryId, setChartCategoryId] = useState("");
  const [chartTagIds, setChartTagIds] = useState([]);

  const { error, setError, message, setMessage, isSaving, setIsSaving } =
    useFeedback();
  const feedback = { setError, setMessage, setIsSaving };

  const {
    transactions,
    categories,
    tags,
    users,
    accounts,
    accountTypes,
    isLoading,
    refreshTransactions,
    refreshCategories,
    refreshTags,
    refreshAccounts,
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
    transactions,
    refreshTransactions,
    refreshAccounts,
    accounts,
    ...feedback,
  });

  const { categoryForm, setCategoryForm, handleCategorySubmit } =
    useCategoryForm({ refreshCategories, ...feedback });

  const { tagForm, setTagForm, handleTagSubmit } = useTagForm({
    refreshTags,
    ...feedback,
  });

  const { accountForm, setAccountForm, handleAccountSubmit } = useAccountForm({
    refreshAccounts,
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
      (left, right) => parseDateValue(right.date) - parseDateValue(left.date),
    )[0];

    setDateFilter((current) => ({
      ...current,
      mode: "month",
      month:
        String(mostRecentTransaction?.date || "").slice(0, 7) ||
        getCurrentMonthInAppTimeZone(),
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

  const pieData = useMemo(
    () => groupExpenseByCategory(visibleTransactions, categories),
    [visibleTransactions, categories],
  );

  const categoryNameById = useMemo(
    () =>
      new Map(
        categories.map((category) => [String(category.id), category.name]),
      ),
    [categories],
  );
  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [String(account.id), account.name])),
    [accounts],
  );
  const tagNameById = useMemo(
    () => new Map(tags.map((tag) => [String(tag.id), tag.name])),
    [tags],
  );
  const accountTypeOptions = useMemo(
    () => (accountTypes.length ? accountTypes : fallbackAccountTypes),
    [accountTypes],
  );
  const userNameById = useMemo(
    () => new Map(users.map((user) => [String(user.id), user.name])),
    [users],
  );
  const filteredAccountsForSummary = useMemo(() => {
    if (!selectedUser) {
      return accounts;
    }

    const userAccounts = accounts.filter((account) => {
      const accountUserName = userNameById.get(String(account.user)) || "";
      return !account.user || accountUserName === selectedUser;
    });

    return userAccounts;
  }, [accounts, selectedUser, userNameById]);
  const accountsTotal = useMemo(() => computeAccountBalances(filteredAccountsForSummary));
  const incomeBreakdown = useMemo(
    () => incomeByAccount(filteredAccountsForSummary),
    [filteredAccountsForSummary],
  );

  const expenseTotal = totalByType(visibleTransactions, "expense");
  const balance = accountsTotal - expenseTotal;
  const isViewLoading = isLoading || isFilterLoading;

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
  const chartCategoryOptions = useMemo(
    () =>
      categories.filter((category) => {
        if (!selectedUser) {
          return true;
        }

        return visibleTransactions.some(
          (transaction) => String(transaction.category_id || "") === String(category.id)
        );
      }),
    [categories, selectedUser, visibleTransactions],
  );
  const selectedChartCategory = useMemo(
    () =>
      categories.find(
        (category) => String(category.id) === String(chartCategoryId),
      ) || null,
    [categories, chartCategoryId],
  );
  const isUtilitiesChart = useMemo(
    () =>
      String(selectedChartCategory?.name || "").trim().toLowerCase() ===
      "utilities",
    [selectedChartCategory],
  );
  const utilitySeriesTags = useMemo(
    () =>
      tags.filter((tag) =>
        utilitiesSeriesTagNames.includes(String(tag.name || "").trim()),
      ),
    [tags],
  );
  const allowedUtilitySeriesTagIds = useMemo(
    () => utilitySeriesTags.map((tag) => String(tag.id)),
    [utilitySeriesTags],
  );
  const effectiveChartTagIds = useMemo(
    () =>
      isUtilitiesChart
        ? chartTagIds.filter((tagId) =>
            allowedUtilitySeriesTagIds.includes(String(tagId)),
          )
        : [],
    [allowedUtilitySeriesTagIds, chartTagIds, isUtilitiesChart],
  );
  useEffect(() => {
    if (!isUtilitiesChart && chartTagIds.length) {
      setChartTagIds([]);
      return;
    }

    if (
      isUtilitiesChart &&
      chartTagIds.some(
        (tagId) => !allowedUtilitySeriesTagIds.includes(String(tagId)),
      )
    ) {
      setChartTagIds(
        chartTagIds.filter((tagId) =>
          allowedUtilitySeriesTagIds.includes(String(tagId)),
        ),
      );
    }
  }, [allowedUtilitySeriesTagIds, chartTagIds, isUtilitiesChart]);
  const lineChartData = useMemo(
    () =>
      buildLineChartData(visibleTransactions, categories, tags, {
        selectedCategoryId: chartCategoryId,
        selectedTagIds: effectiveChartTagIds
      }),
    [visibleTransactions, categories, tags, chartCategoryId, effectiveChartTagIds],
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
  const availableAccounts = useMemo(
    () => {
      const filteredAccounts = accounts.filter((account) => {
        if (
          Number(account.is_active) !== 1 &&
          String(account.id) !== String(transactionForm.account_id) &&
          String(account.id) !== String(transactionForm.transfer_account_id)
        ) {
          return false;
        }

        if (!selectedUser) {
          return true;
        }

        const owner =
          users.find((user) => String(user.id) === String(account.user))
            ?.name || "";
        return !account.user || owner === selectedUser;
      });

      return filteredAccounts;
    },
    [
      accounts,
      selectedUser,
      transactionForm.account_id,
      transactionForm.transfer_account_id,
      users,
    ],
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
            accountsTotal={accountsTotal}
            expenseTotal={expenseTotal}
            balance={balance}
            incomeBreakdown={incomeBreakdown}
            users={users}
          />

          <ChartsSection
            isViewLoading={isViewLoading}
            lineChartData={lineChartData}
            pieData={pieData}
            chartCategoryId={chartCategoryId}
            setChartCategoryId={setChartCategoryId}
            chartTagIds={effectiveChartTagIds}
            setChartTagIds={setChartTagIds}
            chartCategoryOptions={chartCategoryOptions}
            isUtilitiesChart={isUtilitiesChart}
            utilitySeriesTags={utilitySeriesTags}
          />

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
            accounts={filteredAccountsForSummary}
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
            handleAccountSubmit={handleAccountSubmit}
            accountForm={accountForm}
            setAccountForm={setAccountForm}
            emptyAccount={emptyAccount}
            accounts={availableAccounts}
            accountTypes={accountTypeOptions}
            users={users}
            userNameById={userNameById}
          />
        </Stack>
      </Box>
    </Box>
  );
}

export default App;
