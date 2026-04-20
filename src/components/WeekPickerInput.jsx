import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { formatDateKey, getWeekEndValue, getWeekStartValue } from "../lib/format";

function formatWeekLabel(value) {
    const weekStart = getWeekStartValue(value);
    const weekEnd = getWeekEndValue(value);

    if (!weekStart || !weekEnd) {
        return "";
    }

    return `${dayjs(weekStart).format("MMM D")} - ${dayjs(weekEnd).format("MMM D, YYYY")}`;
}

export function WeekPickerInput({ value, onChange, label = "Week", placeholder = "Pick a week" }) {
    const selectedWeekStart = getWeekStartValue(value);
    const selectedWeekEnd = getWeekEndValue(value);

    return (
        <DatePickerInput
            placeholder={placeholder}
            value={value || null}
            onChange={(nextValue) => onChange(nextValue ? getWeekStartValue(nextValue) : "")}
            valueFormatter={({ date }) => {
                if (!date || Array.isArray(date)) {
                    return "";
                }

                return formatWeekLabel(date);
            }}
            firstDayOfWeek={1}
            withWeekNumbers
            clearable
            size="sm"
            getDayProps={(date) => {
                const dateKey = formatDateKey(date);
                const isInSelectedWeek = Boolean(
                    selectedWeekStart
                    && selectedWeekEnd
                    && dateKey >= selectedWeekStart
                    && dateKey <= selectedWeekEnd
                );

                if (!isInSelectedWeek) {
                    return {};
                }

                return {
                    style: {
                        backgroundColor: "rgba(15,118,110,0.14)",
                        color: "#0f172a",
                        fontWeight: 700,
                        borderRadius:
                            dateKey === selectedWeekStart
                                ? "999px 0 0 999px"
                                : dateKey === selectedWeekEnd
                                    ? "0 999px 999px 0"
                                    : 0
                    }
                };
            }}
            styles={{
                input: {
                    minHeight: 40,
                    borderRadius: 20,
                    borderColor: "rgba(0, 0, 0, 0.23)",
                    fontFamily: "\"Avenir Next\", \"Segoe UI\", sans-serif",
                }
            }}
        />
    );
}
