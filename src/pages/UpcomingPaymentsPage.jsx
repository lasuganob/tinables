import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useNavigate } from "react-router-dom";
import { postData } from "../api/googleSheets";
import { useAppDataContext, useAppFeedbackContext } from "../context/AppDataContext";
import { formatCurrency, formatDate, getTodayInAppTimeZone } from "../lib/format";
import { buildTransactionPrefillFromPayment, getUpcomingPaymentStatus, sortUpcomingPayments } from "../utils/upcomingPayments";

const emptyUpcomingPayment = {
    id: "",
    title: "",
    due_date: getTodayInAppTimeZone(),
    amount: "",
    user: "",
    note: "",
    category_id: "",
    status: "scheduled"
};

export function UpcomingPaymentsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const navigate = useNavigate();
    const { upcomingPayments, users, categories, saveUpcomingPaymentLocally, handleDelete } = useAppDataContext();
    const { setError, setMessage, setIsSaving, isSaving } = useAppFeedbackContext();
    const [paymentForm, setPaymentForm] = useState({
        ...emptyUpcomingPayment,
        user: users[0]?.name || ""
    });
    const [showInlinePaymentEditor, setShowInlinePaymentEditor] = useState(false);

    useEffect(() => {
        if (!showInlinePaymentEditor) {
            return;
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }, [showInlinePaymentEditor]);

    const sortedPayments = useMemo(
        () => sortUpcomingPayments(upcomingPayments.filter((item) => item.status !== "paid")),
        [upcomingPayments]
    );

    const paidPayments = useMemo(
        () => upcomingPayments.filter((item) => item.status === "paid"),
        [upcomingPayments]
    );

    const categoryNameById = useMemo(
        () => new Map(categories.map((category) => [String(category.id), category.name])),
        [categories]
    );

    const summaryCounts = useMemo(() => {
        const today = getTodayInAppTimeZone();

        return sortedPayments.reduce((summary, item) => {
            const status = getUpcomingPaymentStatus(item, today);
            if (status === "overdue") summary.overdue += 1;
            if (status === "today") summary.today += 1;
            if (status === "scheduled") summary.upcoming += 1;
            return summary;
        }, { overdue: 0, today: 0, upcoming: 0 });
    }, [sortedPayments]);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setError("");

        try {
            const payload = {
                ...paymentForm,
                amount: Number(paymentForm.amount),
                status: paymentForm.status || "scheduled"
            };
            const result = await postData(paymentForm.id ? "updateUpcomingPayment" : "addUpcomingPayment", payload);
            saveUpcomingPaymentLocally({
                ...payload,
                id: String(result.id ?? paymentForm.id)
            });
            setPaymentForm({
                ...emptyUpcomingPayment,
                user: users[0]?.name || ""
            });
            setShowInlinePaymentEditor(false);
            setMessage(`Upcoming payment ${result.id ?? payload.id} saved.`);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    function startEdit(payment) {
        setPaymentForm({
            ...payment,
            amount: String(payment.amount ?? "")
        });
        setShowInlinePaymentEditor(true);
    }

    function openNewPaymentRow() {
        setPaymentForm({
            ...emptyUpcomingPayment,
            user: users[0]?.name || ""
        });
        setShowInlinePaymentEditor(true);
    }

    function cancelInlinePaymentEditor() {
        setPaymentForm({
            ...emptyUpcomingPayment,
            user: users[0]?.name || ""
        });
        setShowInlinePaymentEditor(false);
    }

    function renderMobilePaymentCards(items) {
        if (!items.length) {
            return (
                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2, textAlign: "center" }}>
                    {renderUpcomingPaymentTitleAndForm()}
                    <Typography variant="body2" color="text.secondary">No upcoming payments found.</Typography>
                </Paper>
            );
        }

        return (
            <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2, textAlign: "left" }}>
                <Stack spacing={1.25}>
                    {renderUpcomingPaymentTitleAndForm()}
                    {items.map((payment) => {
                        const derivedStatus = getUpcomingPaymentStatus(payment);
                        const actionLabel = derivedStatus === "scheduled" ? "Pay Early" : "Pay Now";

                        return (
                            <Paper key={payment.id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 1.5 }}>
                                <Stack spacing={1.25}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                        <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(payment.due_date)}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700}>
                                                {payment.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {categoryNameById.get(String(payment.category_id)) || "-"}
                                            </Typography>
                                        </Stack>
                                        <Chip
                                            size="small"
                                            label={derivedStatus}
                                            color={derivedStatus === "overdue" ? "error" : derivedStatus === "today" ? "warning" : "default"}
                                        />
                                    </Stack>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            {payment.user}
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight={800}>
                                            {formatCurrency(payment.amount)}
                                        </Typography>
                                    </Stack>

                                    {payment.note ? (
                                        <Typography variant="caption" color="text.secondary">
                                            {payment.note}
                                        </Typography>
                                    ) : null}

                                    <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                                        <Button
                                            size="small"
                                            onClick={() => navigate("/transactions", {
                                                state: {
                                                    transactionPrefill: buildTransactionPrefillFromPayment(payment)
                                                }
                                            })}
                                        >
                                            {actionLabel}
                                        </Button>
                                        <IconButton size="small" onClick={() => startEdit(payment)}>
                                            <EditRoundedIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete("deleteUpcomingPayment", payment.id)}>
                                            <DeleteRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            </Paper>
        );
    }

    function renderUpcomingPaymentTitleAndForm() {
        return (
            <>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                >
                    <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                        Upcoming Payments
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={openNewPaymentRow}
                        disabled={showInlinePaymentEditor}
                        fullWidth={isMobile}
                        sx={{
                            bgcolor: "#4a6555",
                            "&:hover": {
                                bgcolor: "#3f594b"
                            }
                        }}
                    >
                        Add Entry
                    </Button>
                </Stack>

                {showInlinePaymentEditor ? (
                    <Paper
                        elevation={0}
                        sx={{
                            mt: 2,
                            p: { xs: 1.25, sm: 1.5, md: 2 },
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "rgba(15,118,110,0.02)"
                        }}
                    >
                        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {paymentForm.id ? "Edit upcoming payment" : "New upcoming payment"}
                            </Typography>
                            <Box
                                sx={{
                                    display: "grid",
                                    gap: 2,
                                    gridTemplateColumns: { xs: "1fr 1fr", md: "1.3fr 1fr 1fr 1fr" },
                                }}
                            >
                                <TextField
                                    label="Title"
                                    size="small"
                                    value={paymentForm.title}
                                    onChange={(event) => setPaymentForm((current) => ({ ...current, title: event.target.value }))}
                                    required
                                />
                                <TextField
                                    label="Due Date"
                                    type="date"
                                    size="small"
                                    value={paymentForm.due_date}
                                    onChange={(event) => setPaymentForm((current) => ({ ...current, due_date: event.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                                <TextField
                                    label="Amount"
                                    type="number"
                                    size="small"
                                    inputProps={{ min: 0, step: "0.01" }}
                                    value={paymentForm.amount}
                                    onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                                    required
                                />
                                <FormControl fullWidth size="small" required>
                                    <InputLabel>User</InputLabel>
                                    <Select
                                        label="User"
                                        value={paymentForm.user}
                                        onChange={(event) => setPaymentForm((current) => ({ ...current, user: event.target.value }))}
                                    >
                                        {users.map((user) => (
                                            <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        label="Category"
                                        value={String(paymentForm.category_id || "")}
                                        onChange={(event) => setPaymentForm((current) => ({ ...current, category_id: event.target.value }))}
                                    >
                                        {categories
                                            .filter((category) => String(category.type || "").toLowerCase() === "expense")
                                            .map((category) => (
                                                <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Note"
                                    size="small"
                                    value={paymentForm.note}
                                    onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))}
                                    sx={{ gridColumn: { md: "span 2" } }}
                                />
                                <FormControl fullWidth size="small" required>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        label="Status"
                                        value={paymentForm.status}
                                        onChange={(event) => setPaymentForm((current) => ({ ...current, status: event.target.value }))}
                                    >
                                        <MenuItem value="scheduled">Scheduled</MenuItem>
                                        <MenuItem value="paid">Paid</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isSaving}
                                    sx={{
                                        bgcolor: "#4a6555",
                                        "&:hover": {
                                            bgcolor: "#3f594b"
                                        }
                                    }}
                                >
                                    {paymentForm.id ? "Save Entry" : "Add Entry"}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={cancelInlinePaymentEditor}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                ) : null}
            </>
        );
    }

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.35rem", sm: "1.7rem" } }}>
                    Upcoming Payments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Track planned payments before they become actual transactions.
                </Typography>
            </Stack>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr 1fr 1fr" }
                }}
            >
                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}>
                    <Typography variant="overline" color="text.secondary">Overdue</Typography>
                    <Typography variant="h5" fontWeight={700}>{summaryCounts.overdue}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}>
                    <Typography variant="overline" color="text.secondary">Due Today</Typography>
                    <Typography variant="h5" fontWeight={700}>{summaryCounts.today}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}>
                    <Typography variant="overline" color="text.secondary">Upcoming</Typography>
                    <Typography variant="h5" fontWeight={700}>{summaryCounts.upcoming}</Typography>
                </Paper>
            </Box>

            {isMobile ? (
                renderMobilePaymentCards(sortedPayments)
            ) : (
                <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                    {renderUpcomingPaymentTitleAndForm()}
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>User</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Note</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedPayments.map((payment) => {
                                    const derivedStatus = getUpcomingPaymentStatus(payment);
                                    const actionLabel = derivedStatus === "scheduled" ? "Pay Early" : "Pay Now";

                                    return (
                                        <TableRow key={payment.id} hover>
                                            <TableCell>{payment.title}</TableCell>
                                            <TableCell>{formatDate(payment.due_date)}</TableCell>
                                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                            <TableCell>{payment.user}</TableCell>
                                            <TableCell>{categoryNameById.get(String(payment.category_id)) || "-"}</TableCell>
                                            <TableCell>{payment.note || "-"}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={derivedStatus}
                                                    color={derivedStatus === "overdue" ? "error" : derivedStatus === "today" ? "warning" : "default"}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Button
                                                        size="small"
                                                        onClick={() => navigate("/transactions", {
                                                            state: {
                                                                transactionPrefill: buildTransactionPrefillFromPayment(payment)
                                                            }
                                                        })}
                                                    >
                                                        {actionLabel}
                                                    </Button>
                                                    <IconButton size="small" onClick={() => startEdit(payment)}>
                                                        <EditRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDelete("deleteUpcomingPayment", payment.id)}>
                                                        <DeleteRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {!sortedPayments.length ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">No upcoming payments found.</TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Divider />

            {paidPayments.length ? (
                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle1" fontWeight={700}>Paid</Typography>
                        {paidPayments.map((payment) => (
                            <Stack key={payment.id} direction="row" justifyContent="space-between" spacing={2}>
                                <Typography>{payment.title}</Typography>
                                <Typography color="text.secondary">{formatCurrency(payment.amount)}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Paper>
            ) : null}
        </Stack>
    );
}
