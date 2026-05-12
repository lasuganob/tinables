import { useState, useMemo } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
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
import { ConfirmDeleteDialog } from "../../components/ConfirmDeleteDialog";
import { DialogTitleWithClose } from "../../components/DialogTitleWithClose";

const GOAL_TYPES = [
    { value: "savings", label: "Savings" },
    { value: "debt_payoff", label: "Debt Payoff" },
    { value: "purchase", label: "Purchase" },
];

const EMPTY_FORM = {
    name: "",
    type: "savings",
    target_amount: "",
    current_amount: "",
    monthly_target: "",
    target_date: "",
    note: "",
    status: "active",
};

export function GoalEditorDialog({
    open,
    onClose,
    onSave,
    onDelete,
    isSaving,
    goal = null,
}) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const isBusy = isSaving || isDeleting;

    const initialForm = useMemo(() => {
        if (goal) {
            return {
                name: goal.name || "",
                type: goal.type || "savings",
                target_amount: String(goal.target_amount || ""),
                current_amount: String(goal.current_amount || ""),
                monthly_target: String(goal.monthly_target || ""),
                target_date: goal.target_date || "",
                note: goal.note || "",
                status: goal.status || "active",
            };
        }
        return { ...EMPTY_FORM };
    }, [goal]);

    const [form, setForm] = useState(initialForm);

    const handleOpen = () => {
        setForm(initialForm);
        setConfirmDeleteOpen(false);
        setIsDeleting(false);
    };

    function handleField(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    const isValid =
        form.name.trim() &&
        form.type &&
        Number(form.target_amount) > 0;

    function handleSubmit() {
        if (!isValid) return;
        onSave({
            ...(goal ? { id: goal.id } : {}),
            name: form.name.trim(),
            type: form.type,
            target_amount: Number(form.target_amount),
            current_amount: Number(form.current_amount) || 0,
            monthly_target: Number(form.monthly_target) || 0,
            target_date: form.target_date || "",
            note: form.note,
            status: form.status || "active",
        });
    }

    async function handleConfirmDelete() {
        if (!goal?.id || !onDelete) return;
        setIsDeleting(true);
        try {
            const deleted = await onDelete(goal);
            if (deleted !== false) {
                setConfirmDeleteOpen(false);
            }
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
        <Dialog
            open={open}
            onClose={isBusy ? undefined : onClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="sm"
            TransitionProps={{ onEnter: handleOpen }}
        >
            <DialogTitleWithClose onClose={onClose} disabled={isBusy}>
                {goal ? "Edit Goal" : "Add Goal"}
            </DialogTitleWithClose>

            <DialogContent dividers>
                <Stack spacing={2.5} sx={{ pt: 0.5 }}>
                    {/* Goal Name */}
                    <TextField
                        label="Goal Name"
                        size="small"
                        required
                        fullWidth
                        disabled={isBusy}
                        value={form.name}
                        onChange={(e) => handleField("name", e.target.value)}
                        placeholder="e.g. Emergency Fund"
                    />

                    {/* Goal Type */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
                            Goal Type
                        </Typography>
                        <ToggleButtonGroup
                            value={form.type}
                            exclusive
                            onChange={(_, v) => v && handleField("type", v)}
                            size="small"
                            fullWidth
                            disabled={isBusy}
                        >
                            {GOAL_TYPES.map((gt) => (
                                <ToggleButton
                                    key={gt.value}
                                    value={gt.value}
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.78rem",
                                        flex: 1,
                                        "&.Mui-selected": {
                                            bgcolor: "#4a6555",
                                            color: "white",
                                            "&:hover": { bgcolor: "#3f594b" },
                                        },
                                    }}
                                >
                                    {gt.label}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>

                    {/* Amounts row */}
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                        <TextField
                            label="Target Amount"
                            type="number"
                            size="small"
                            required
                            fullWidth
                            disabled={isBusy}
                            inputProps={{ min: 0, step: "0.01" }}
                            value={form.target_amount}
                            onChange={(e) => handleField("target_amount", e.target.value)}
                        />
                        <TextField
                            label="Current Amount Saved"
                            type="number"
                            size="small"
                            fullWidth
                            disabled={isBusy}
                            inputProps={{ min: 0, step: "0.01" }}
                            value={form.current_amount}
                            onChange={(e) => handleField("current_amount", e.target.value)}
                        />
                    </Box>

                    {/* Monthly target & target date row */}
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                        <TextField
                            label="Monthly Target (optional)"
                            type="number"
                            size="small"
                            fullWidth
                            disabled={isBusy}
                            inputProps={{ min: 0, step: "0.01" }}
                            value={form.monthly_target}
                            onChange={(e) => handleField("monthly_target", e.target.value)}
                            helperText="Used to calculate on-track status"
                        />
                        <DatePicker
                            label="Target Date (optional)"
                            value={form.target_date ? dayjs(form.target_date) : null}
                            onChange={(v) => handleField("target_date", v ? v.format("YYYY-MM-DD") : "")}
                            disabled={isBusy}
                            slotProps={{ textField: { size: "small", fullWidth: true } }}
                        />
                    </Box>

                    {/* Status (only shown for existing goals) */}
                    {goal && (
                        <FormControl fullWidth size="small" disabled={isBusy}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                label="Status"
                                value={form.status}
                                onChange={(e) => handleField("status", e.target.value)}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="paused">Paused</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    {/* Note */}
                    <TextField
                        label="Note"
                        multiline
                        minRows={2}
                        size="small"
                        fullWidth
                        disabled={isBusy}
                        value={form.note}
                        onChange={(e) => handleField("note", e.target.value)}
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                {goal && onDelete ? (
                    <Button
                        color="error"
                        onClick={() => setConfirmDeleteOpen(true)}
                        disabled={isBusy}
                    >
                        Delete
                    </Button>
                ) : null}
                <Box sx={{ flex: 1 }} />
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={isBusy}
                    sx={{ color: "#4a6555", borderColor: "rgba(74,101,85,0.35)", "&:hover": { borderColor: "#4a6555", bgcolor: "rgba(74,101,85,0.08)" } }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isBusy || !isValid}
                    sx={{ bgcolor: "#4a6555", "&:hover": { bgcolor: "#3f594b" } }}
                >
                    {isSaving ? "Saving..." : goal ? "Save Goal" : "Add Goal"}
                </Button>
            </DialogActions>
        </Dialog>

        <ConfirmDeleteDialog
            open={confirmDeleteOpen}
            title="Delete goal?"
            message={goal ? `Delete "${goal.name || "this goal"}"?` : ""}
            isSaving={isDeleting}
            onCancel={() => setConfirmDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
        />
        </>
    );
}
