import { useEffect, useMemo, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { useAppDataContext } from "../context/AppDataContext";
import { useAppFiltersContext } from "../context/AppFiltersContext";
import {
  totalByType,
  buildLineChartData,
  groupExpenseByCategory,
  incomeByAccount,
  computeAccountBalances,
} from "../utils/transactions";

import { GlobalFiltersSection } from "../sections/GlobalFiltersSection";
import { SummaryStatsSection } from "../sections/SummaryStatsSection";
import { ChartsSection } from "../sections/ChartsSection";

export function DashboardPage() {
  const utilitiesSeriesTagNames = ["Rent", "Internet", "Electricity", "Water"];

  const {
    transactions,
    categories,
    tags,
    users,
    accounts,
    isLoading,
  } = useAppDataContext();

  const {
    selectedUser,
    setSelectedUser,
    dateFilter,
    setDateFilter,
    updateDateFilter,
    toPickerValue,
    availableYears,
    isFilterLoading,
    resetFilters,
  } = useAppFiltersContext();

  // Chart-local state belongs on this page.
  const [chartCategoryId, setChartCategoryId] = useState("");
  const [chartTagIds, setChartTagIds] = useState([]);

  const isViewLoading = isLoading || isFilterLoading;

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

  const userNameById = useMemo(
    () => new Map(users.map((u) => [String(u.id), u.name])),
    [users],
  );

  const filteredAccountsForSummary = useMemo(() => {
    if (!selectedUser) return accounts;
    return accounts.filter((account) => {
      const owner = userNameById.get(String(account.user)) || "";
      return !account.user || owner === selectedUser;
    });
  }, [accounts, selectedUser, userNameById]);

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

  const pieData = useMemo(
    () => groupExpenseByCategory(visibleTransactions, categories),
    [visibleTransactions, categories],
  );
  const topExpenseCategories = useMemo(() => pieData.slice(0, 3), [pieData]);

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
        <Typography variant="h5" fontWeight={700}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of your finances
        </Typography>
      </Stack>

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
        incomeTotal={incomeTotal}
        expenseTotal={expenseTotal}
        incomeBreakdown={incomeBreakdown}
        topExpenseCategories={topExpenseCategories}
        users={users}
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
    </Stack>
  );
}
