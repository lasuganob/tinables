import { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAppDataContext } from "../context/AppDataContext";
import { useAppFiltersContext } from "../context/AppFiltersContext";
import { useAuth } from "../auth/AuthGate";
import {
  formatDateKey,
  getWeekEndValue,
  getWeekStartValue,
  isDateWithinWeek,
  parseDateValue,
} from "../lib/format";
import {
  totalByType,
  buildLineChartData,
  groupExpenseByCategory,
  incomeByAccount,
  computeAccountBalances,
} from "../utils/transactions";

import { SummaryStatsSection } from "../sections/SummaryStatsSection";
import { ChartsSection } from "../sections/ChartsSection";

function addDays(dateValue, days) {
  const date = parseDateValue(dateValue);

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function getMonthPeriod(monthValue) {
  if (!/^\d{4}-\d{2}$/.test(String(monthValue || ""))) {
    return null;
  }

  const [year, month] = monthValue.split("-").map(Number);
  return {
    startDate: `${monthValue}-01`,
    endDate: formatDateKey(new Date(year, month, 0)),
  };
}

function getYearPeriod(yearValue) {
  if (!/^\d{4}$/.test(String(yearValue || ""))) {
    return null;
  }

  return {
    startDate: `${yearValue}-01-01`,
    endDate: `${yearValue}-12-31`,
  };
}

function getComparisonPeriod(dateFilter) {
  if (dateFilter.mode === "month" && dateFilter.month) {
    const current = getMonthPeriod(dateFilter.month);
    const [year, month] = dateFilter.month.split("-").map(Number);
    const previousMonth = formatDateKey(new Date(year, month - 2, 1)).slice(0, 7);
    const previous = getMonthPeriod(previousMonth);

    return current && previous ? { ...current, previous, label: "last mo." } : null;
  }

  if (dateFilter.mode === "week" && dateFilter.week) {
    const startDate = getWeekStartValue(dateFilter.week);
    const endDate = getWeekEndValue(startDate);

    if (!startDate || !endDate) {
      return null;
    }

    return {
      startDate,
      endDate,
      previous: {
        startDate: addDays(startDate, -7),
        endDate: addDays(endDate, -7),
      },
      label: "last wk.",
    };
  }

  if (dateFilter.mode === "year" && dateFilter.year) {
    const current = getYearPeriod(dateFilter.year);
    const previous = getYearPeriod(String(Number(dateFilter.year) - 1));

    return current && previous ? { ...current, previous, label: "last yr." } : null;
  }

  return null;
}

function getAccountSummaryEndDate(dateFilter) {
  if (dateFilter.mode === "month" && dateFilter.month) {
    return getMonthPeriod(dateFilter.month)?.endDate || "";
  }

  if (dateFilter.mode === "week" && dateFilter.week) {
    return getWeekEndValue(dateFilter.week);
  }

  if (dateFilter.mode === "year" && dateFilter.year) {
    return getYearPeriod(dateFilter.year)?.endDate || "";
  }

  if (dateFilter.mode === "range" && dateFilter.endDate) {
    return formatDateKey(dateFilter.endDate);
  }

  return "";
}

function isTransactionWithinPeriod(transaction, period) {
  const dateKey = formatDateKey(transaction.date);

  return Boolean(
    dateKey &&
    period?.startDate &&
    period?.endDate &&
    dateKey >= period.startDate &&
    dateKey <= period.endDate
  );
}

function getAccountsAtPeriodEnd(accounts, transactions, periodEndDate) {
  if (!periodEndDate) {
    return accounts;
  }

  return accounts.map((account) => {
    const accountId = String(account.id);
    let balance = Number(account.balance || 0);

    transactions.forEach((transaction) => {
      const transactionDate = formatDateKey(transaction.date);

      if (!transactionDate || transactionDate <= periodEndDate) {
        return;
      }

      const amount = Number(transaction.amount || 0);
      const transferFee = Number(transaction.transfer_fee || 0);
      const sourceAccountId = String(transaction.account_id || "");
      const transferAccountId = String(transaction.transfer_account_id || "");

      if (transaction.type === "income" && accountId === sourceAccountId) {
        balance -= amount;
      } else if (transaction.type === "expense" && accountId === sourceAccountId) {
        balance += amount;
      } else if (transaction.type === "transfer") {
        if (accountId === sourceAccountId) {
          balance += amount + transferFee;
        }

        if (accountId === transferAccountId) {
          balance -= amount;
        }
      }
    });

    return balance === Number(account.balance || 0)
      ? account
      : { ...account, balance };
  });
}

function buildPercentInsight(currentValue, previousValue, label, { lowerIsBetter = false } = {}) {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (!label) {
    return null;
  }

  if (previous === 0) {
    return {
      text: "Nothing to compare with",
      tone: "neutral"
    };
  }

  const rawPercentage = ((current - previous) / Math.abs(previous)) * 100;
  const percentage = Math.abs(rawPercentage) < 0.05 ? 0 : rawPercentage;
  const isPositiveMovement = percentage > 0;
  const isNegativeMovement = percentage < 0;
  const tone =
    percentage === 0
      ? "neutral"
      : lowerIsBetter
        ? isNegativeMovement ? "positive" : "negative"
        : isPositiveMovement ? "positive" : "negative";
  const sign = percentage > 0 ? "+" : "";

  return {
    text: `${sign}${percentage.toFixed(1)}% vs ${label}`,
    tone,
  };
}

export function DashboardPage() {
  const utilitiesSeriesTagNames = ["Rent", "Internet", "Electricity", "Water"];
  const { onLogout } = useAuth();

  const {
    transactions,
    categories,
    tags,
    users,
    accounts,
    accountTypes,
    isLoading,
  } = useAppDataContext();

  const {
    selectedUser,
    dateFilter,
    isFilterLoading,
  } = useAppFiltersContext();

  // Chart-local state belongs on this page.
  const [chartCategoryId, setChartCategoryId] = useState("");
  const [chartTagIds, setChartTagIds] = useState([]);

  const isViewLoading = isLoading || isFilterLoading;

  const userScopedTransactions = useMemo(
    () =>
      selectedUser
        ? transactions.filter((t) => t.user === selectedUser)
        : transactions,
    [selectedUser, transactions],
  );

  const visibleTransactions = useMemo(() => {
    return userScopedTransactions.filter((t) => {
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
  }, [dateFilter, userScopedTransactions]);

  const userNameById = useMemo(
    () => new Map(users.map((u) => [String(u.id), u.name])),
    [users],
  );

  const selectedUserAccounts = useMemo(() => {
    if (!selectedUser) return accounts;
    return accounts.filter((account) => {
      const owner = userNameById.get(String(account.user)) || "";
      return !account.user || owner === selectedUser;
    });
  }, [accounts, selectedUser, userNameById]);

  const accountSummaryEndDate = useMemo(
    () => getAccountSummaryEndDate(dateFilter),
    [dateFilter],
  );

  const filteredAccountsForSummary = useMemo(
    () =>
      getAccountsAtPeriodEnd(
        selectedUserAccounts,
        userScopedTransactions,
        accountSummaryEndDate,
      ),
    [accountSummaryEndDate, selectedUserAccounts, userScopedTransactions],
  );

  const accountsTotal = useMemo(
    () => computeAccountBalances(filteredAccountsForSummary),
    [filteredAccountsForSummary],
  );
  const incomeBreakdown = useMemo(
    () => incomeByAccount(filteredAccountsForSummary),
    [filteredAccountsForSummary],
  );
  const incomeTotal = totalByType(visibleTransactions, "income");
  const expenseTotal = totalByType(visibleTransactions, "expense");
  const netCashflowTotal = incomeTotal - expenseTotal;

  const comparisonPeriod = useMemo(
    () => getComparisonPeriod(dateFilter),
    [dateFilter],
  );

  const statInsights = useMemo(() => {
    if (!comparisonPeriod) {
      return {};
    }

    const previousTransactions = userScopedTransactions.filter((transaction) =>
      isTransactionWithinPeriod(transaction, comparisonPeriod.previous)
    );
    const previousIncomeTotal = totalByType(previousTransactions, "income");
    const previousExpenseTotal = totalByType(previousTransactions, "expense");
    const previousNetCashflowTotal = previousIncomeTotal - previousExpenseTotal;
    const previousAccountsTotal = computeAccountBalances(
      getAccountsAtPeriodEnd(
        selectedUserAccounts,
        userScopedTransactions,
        comparisonPeriod.previous.endDate,
      ),
    );

    return {
      accounts: buildPercentInsight(
        accountsTotal,
        previousAccountsTotal,
        comparisonPeriod.label,
      ),
      income: buildPercentInsight(
        incomeTotal,
        previousIncomeTotal,
        comparisonPeriod.label,
      ),
      expenses: buildPercentInsight(
        expenseTotal,
        previousExpenseTotal,
        comparisonPeriod.label,
        { lowerIsBetter: true },
      ),
      netCashflow: buildPercentInsight(
        netCashflowTotal,
        previousNetCashflowTotal,
        comparisonPeriod.label,
      ),
    };
  }, [
    accountsTotal,
    comparisonPeriod,
    expenseTotal,
    incomeTotal,
    netCashflowTotal,
    selectedUserAccounts,
    userScopedTransactions,
  ]);

  const pieData = useMemo(
    () => groupExpenseByCategory(visibleTransactions, categories),
    [visibleTransactions, categories],
  );

  const chartCategoryOptions = useMemo(
    () =>
      categories.filter((cat) => {
        if (!selectedUser) return true;
        return visibleTransactions.some(
          (t) => String(t.category_id || "") === String(cat.id),
        );
      }),
    [categories, selectedUser, visibleTransactions],
  );

  const selectedChartCategory = useMemo(
    () =>
      categories.find((c) => String(c.id) === String(chartCategoryId)) || null,
    [categories, chartCategoryId],
  );

  const isUtilitiesChart = useMemo(
    () =>
      String(selectedChartCategory?.name || "")
        .trim()
        .toLowerCase() === "utilities",
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
        ? chartTagIds.filter((id) =>
            allowedUtilitySeriesTagIds.includes(String(id)),
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
      chartTagIds.some((id) => !allowedUtilitySeriesTagIds.includes(String(id)))
    ) {
      setChartTagIds(
        chartTagIds.filter((id) => allowedUtilitySeriesTagIds.includes(String(id))),
      );
    }
  }, [allowedUtilitySeriesTagIds, chartTagIds, isUtilitiesChart]);

  const defaultLineChartData = useMemo(
    () =>
      buildLineChartData(visibleTransactions, categories, tags, {
        selectedCategoryId: "",
        selectedTagIds: [],
      }),
    [visibleTransactions, categories, tags],
  );

  const lineChartData = useMemo(
    () =>
      buildLineChartData(visibleTransactions, categories, tags, {
        selectedCategoryId: chartCategoryId,
        selectedTagIds: effectiveChartTagIds,
      }),
    [visibleTransactions, categories, tags, chartCategoryId, effectiveChartTagIds],
  );

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.35rem", sm: "1.7rem" } }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}>
          Overview of your finances
        </Typography>
      </Stack>

      <SummaryStatsSection
        isViewLoading={isViewLoading}
        accountsTotal={accountsTotal}
        incomeTotal={incomeTotal}
        expenseTotal={expenseTotal}
        netCashflowTotal={netCashflowTotal}
        incomeBreakdown={incomeBreakdown}
        users={users}
        accountTypes={accountTypes}
        statInsights={statInsights}
      />

      <ChartsSection
        isViewLoading={isViewLoading}
        defaultLineChartData={defaultLineChartData}
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

      <Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutRoundedIcon />}
          onClick={onLogout}
          sx={{
            borderRadius: 2.5,
            px: 2,
            py: 1,
            backgroundColor: "background.paper",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
            "&:hover": {
              backgroundColor: "background.paper",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Stack>
  );
}
