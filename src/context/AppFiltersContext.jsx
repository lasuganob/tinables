import { createContext, useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { getCurrentMonthInAppTimeZone, getCurrentWeekStartInAppTimeZone, parseDateValue } from "../lib/format";

const AppFiltersContext = createContext(null);

export function AppFiltersProvider({ transactions, children }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [dateFilter, setDateFilter] = useState({
    mode: "month",
    month: getCurrentMonthInAppTimeZone(),
    week: getCurrentWeekStartInAppTimeZone(),
    year: "",
    startDate: "",
    endDate: "",
  });
  const [hasInitializedDefaultMonth, setHasInitializedDefaultMonth] = useState(false);

  useEffect(() => {
    if (hasInitializedDefaultMonth || !transactions.length) return;

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

  function updateDateFilter(key, value) {
    setDateFilter((current) => ({ ...current, [key]: value }));
  }

  function toPickerValue(value) {
    return value ? dayjs(value) : null;
  }

  function resetFilters() {
    setSelectedUser("");
    setDateFilter({
      mode: "month",
      month: getCurrentMonthInAppTimeZone(),
      week: getCurrentWeekStartInAppTimeZone(),
      year: "",
      startDate: "",
      endDate: "",
    });
  }

  const availableYears = useMemo(
    () =>
      [
        ...new Set(
          transactions
            .map((t) => String(t.date || "").slice(0, 4))
            .filter(Boolean),
        ),
      ].sort((l, r) => Number(r) - Number(l)),
    [transactions],
  );

  const value = useMemo(
    () => ({
      selectedUser,
      setSelectedUser,
      dateFilter,
      setDateFilter,
      updateDateFilter,
      toPickerValue,
      resetFilters,
      availableYears,
      isFilterLoading: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedUser, dateFilter, availableYears],
  );

  return (
    <AppFiltersContext.Provider value={value}>
      {children}
    </AppFiltersContext.Provider>
  );
}

export function useAppFiltersContext() {
  const ctx = useContext(AppFiltersContext);
  if (!ctx) throw new Error("useAppFiltersContext must be used within AppFiltersProvider");
  return ctx;
}
