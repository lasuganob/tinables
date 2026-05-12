import { useState, useMemo } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { CategorySelector } from "../../components/CategorySelector";
import { DialogTitleWithClose } from "../../components/DialogTitleWithClose";
import { WeekPickerInput } from "../../components/WeekPickerInput";
import { getWeekEndValue } from "../../lib/format";

const PERIOD_TYPES = [
    { value: "monthly", label: "Monthly" },
    { value: "bi-monthly", label: "Bi-monthly" },
    { value: "weekly", label: "Weekly" },
    { value: "custom", label: "Custom" },
];

function getDefaultPeriod(periodType) {
    const today = dayjs();
    if (periodType === "monthly") {
        return {
            period_start: today.startOf("month").format("YYYY-MM-DD"),
            period_end: today.endOf("month").format("YYYY-MM-DD"),
        };
    }
    if (periodType === "bi-monthly") {
        const isFirstHalf = today.date() <= 15;
        return {
            period_start: isFirstHalf
                ? today.startOf("month").format("YYYY-MM-DD")
                : today.date(16).format("YYYY-MM-DD"),
            period_end: isFirstHalf
                ? today.date(15).format("YYYY-MM-DD")
                : today.endOf("month").format("YYYY-MM-DD"),
        };
    }
    if (periodType === "weekly") {
        const monday = today.startOf("week").add(1, "day");
        return {
            period_start: monday.format("YYYY-MM-DD"),
            period_end: monday.add(6, "day").format("YYYY-MM-DD"),
        };
    }
    // custom — leave blank so user sets both manually
    return { period_start: "", period_end: "" };
}

const EMPTY_FORM = {
    category_id: "",
    budget_amount: "",
    period_type: "monthly",
    period_start: dayjs().startOf("month").format("YYYY-MM-DD"),
    period_end: dayjs().endOf("month").format("YYYY-MM-DD"),
    note: "",
};

export function BudgetEditorDialog({ open, onClose, onSave, isSaving, categories, budget = null }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const initialForm = useMemo(() => {
        if (budget) {
            return {
                category_id: String(budget.category_id || ""),
                budget_amount: String(budget.budget_amount || ""),
                period_type: budget.period_type || "monthly",
                period_start: budget.period_start || "",
                period_end: budget.period_end || "",
                note: budget.note || "",
            };
        }
        return { ...EMPTY_FORM };
    }, [budget]);

    const [form, setForm] = useState(initialForm);

    // Reset form whenever dialog opens
    const handleOpen = () => setForm(initialForm);

    function handlePeriodTypeChange(_, newType) {
        if (!newType) return;
        const dates = getDefaultPeriod(newType);
        setForm((f) => ({ ...f, period_type: newType, ...dates }));
    }

    function handleField(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    const isValid =
        form.category_id &&
        Number(form.budget_amount) > 0 &&
        form.period_start &&
        form.period_end;

    function handleSubmit() {
        if (!isValid) return;
        onSave({
            ...(budget ? { id: budget.id } : {}),
            category_id: form.category_id,
            budget_amount: Number(form.budget_amount),
            period_type: form.period_type,
            period_start: form.period_start,
            period_end: form.period_end,
            note: form.note,
        });
    }

    // Only expense categories make sense for budgets
    const expenseCategories = useMemo(
        () => (categories || []).filter((c) => String(c.type || "").toLowerCase() === "expense"),
        [categories]
    );

    return (
        <Dialog
            open={open}
            onClose={isSaving ? undefined : onClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="sm"
            TransitionProps={{ onEnter: handleOpen }}
        >
            <DialogTitleWithClose onClose={onClose} disabled={isSaving}>
                {budget ? "Edit Budget" : "Add Budget"}
            </DialogTitleWithClose>

            <DialogContent dividers>
                <Stack spacing={2.5} sx={{ pt: 0.5 }}>
                    {/* Category */}
                    <CategorySelector
                        label="Category"
                        value={form.category_id}
                        onChange={(v) => handleField("category_id", v)}
                        categories={expenseCategories}
                        required
                        disabled={isSaving}
                        placeholder="Select a category"
                    />

                    {/* Budget Amount */}
                    <TextField
                        label="Budget Amount"
                        type="number"
                        size="small"
                        required
                        fullWidth
                        disabled={isSaving}
                        inputProps={{ min: 0, step: "0.01" }}
                        value={form.budget_amount}
                        onChange={(e) => handleField("budget_amount", e.target.value)}
                    />

                    {/* Period Type toggle */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
                            Period Type
                        </Typography>
                        <ToggleButtonGroup
                            value={form.period_type}
                            exclusive
                            onChange={handlePeriodTypeChange}
                            size="small"
                            fullWidth
                            disabled={isSaving}
                            sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
                        >
                            {PERIOD_TYPES.map((pt) => (
                                <ToggleButton
                                    key={pt.value}
                                    value={pt.value}
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.78rem",
                                        flex: { xs: "1 0 40%", sm: 1 },
                                        "&.Mui-selected": {
                                            bgcolor: "#4a6555",
                                            color: "white",
                                            "&:hover": { bgcolor: "#3f594b" },
                                        },
                                    }}
                                >
                                    {pt.label}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>

                    {/* Conditional Period Inputs */}
                    {form.period_type === "monthly" && (
                        <DatePicker
                            label="Select Month"
                            views={["year", "month"]}
                            openTo="month"
                            value={form.period_start ? dayjs(form.period_start) : null}
                            minDate={dayjs().startOf("month")}
                            onChange={(v) => {
                                if (v) {
                                    setForm({
                                        ...form,
                                        period_start: v.startOf("month").format("YYYY-MM-DD"),
                                        period_end: v.endOf("month").format("YYYY-MM-DD"),
                                    });
                                }
                            }}
                            slotProps={{ textField: { size: "small", fullWidth: true, required: true } }}
                        />
                    )}

                    {form.period_type === "weekly" && (
                        <Box>
                            <WeekPickerInput
                                label="Select Week"
                                value={form.period_start}
                                onChange={(v) => {
                                    if (v) {
                                        setForm({
                                            ...form,
                                            period_start: v,
                                            period_end: getWeekEndValue(v),
                                        });
                                    }
                                }}
                                popoverProps={{ withinPortal: true, zIndex: 2000 }}
                            />
                        </Box>
                    )}

                    {(form.period_type === "custom" || form.period_type === "bi-monthly") && (
                        <Box
                            sx={{
                                display: "grid",
                                gap: 1.5,
                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            }}
                        >
                            <DatePicker
                                label="Period Start"
                                value={form.period_start ? dayjs(form.period_start) : null}
                                onChange={(v) => {
                                    if (v) {
                                        const newStart = v.format("YYYY-MM-DD");
                                        let newEnd = form.period_end;
                                        
                                        // For bi-monthly, if end date is now too far, clamp it
                                        if (form.period_type === "bi-monthly" && newEnd) {
                                            const diff = dayjs(newEnd).diff(v, "day");
                                            if (diff > 14 || diff < 0) {
                                                newEnd = v.add(14, "day").format("YYYY-MM-DD");
                                            }
                                        }
                                        
                                        setForm({ ...form, period_start: newStart, period_end: newEnd });
                                    }
                                }}
                                disabled={isSaving}
                                slotProps={{ textField: { size: "small", fullWidth: true, required: true } }}
                            />
                            <DatePicker
                                label="Period End"
                                value={form.period_end ? dayjs(form.period_end) : null}
                                onChange={(v) => handleField("period_end", v ? v.format("YYYY-MM-DD") : "")}
                                disabled={isSaving}
                                minDate={form.period_start ? dayjs(form.period_start) : undefined}
                                maxDate={
                                    form.period_type === "bi-monthly" && form.period_start 
                                        ? dayjs(form.period_start).add(14, "day") 
                                        : undefined
                                }
                                slotProps={{ 
                                    textField: { 
                                        size: "small", 
                                        fullWidth: true, 
                                        required: true,
                                        helperText: form.period_type === "bi-monthly" ? "Max 15 days range" : ""
                                    } 
                                }}
                            />
                        </Box>
                    )}

                    {/* Note */}
                    <TextField
                        label="Note"
                        multiline
                        minRows={2}
                        size="small"
                        fullWidth
                        disabled={isSaving}
                        value={form.note}
                        onChange={(e) => handleField("note", e.target.value)}
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={isSaving}
                    sx={{ color: "#4a6555", borderColor: "rgba(74,101,85,0.35)", "&:hover": { borderColor: "#4a6555", bgcolor: "rgba(74,101,85,0.08)" } }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSaving || !isValid}
                    sx={{ bgcolor: "#4a6555", "&:hover": { bgcolor: "#3f594b" } }}
                >
                    {isSaving ? "Saving..." : budget ? "Save Budget" : "Add Budget"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
