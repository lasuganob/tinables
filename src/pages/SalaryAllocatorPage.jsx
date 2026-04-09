import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { postData } from "../api/googleSheets";
import { AllocateAmountDialog } from "../components/AllocateAmountDialog";
import { PieChart } from "../components/PieChart";
import { EditSalaryAllocationsDialog } from "../components/EditSalaryAllocationsDialog";
import { useAppDataContext, useAppFeedbackContext } from "../context/AppDataContext";
import { formatCurrency, getTodayInAppTimeZone } from "../lib/format";
import {
    computeSalaryBreakdown,
    getAllocatedAmountForItem,
    getAllocationItems,
    getDefaultAllocation,
    isSalaryTransaction,
    isSalaryAllocationBase,
    toPieChartData,
    validateAllocationItems
} from "../utils/salaryAllocator";

export function SalaryAllocatorPage() {
    const navigate = useNavigate();
    const { id: routeTransactionId = "" } = useParams();
    const {
        salaryAllocations,
        salaryAllocationItems,
        transactions,
        categories,
        accounts,
        accountTypes,
        tags,
        users,
        isLoading,
        salaryAllocationHistory,
        saveTransactionLocally,
        saveSalaryAllocationHistoryLocally,
        saveSalaryAllocationLocally,
        saveSalaryAllocationItemLocally,
        removeSalaryAllocationItemLocally
    } = useAppDataContext();
    const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
    const [selectedUser, setSelectedUser] = useState("");
    const [salaryAmount, setSalaryAmount] = useState("");
    const [selectedAllocationId, setSelectedAllocationId] = useState("");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [allocationDialogItem, setAllocationDialogItem] = useState(null);
    const [allocationForm, setAllocationForm] = useState({
        type: "expense",
        category_id: "",
        transfer_account_id: "",
        tags: [],
        note: ""
    });
    const [isTagsMenuOpen, setIsTagsMenuOpen] = useState(false);
    const isAllocatorMode = Boolean(String(routeTransactionId || "").trim());
    const routeTransaction = useMemo(() => {
        if (!isAllocatorMode || isLoading) {
            return null;
        }

        return transactions.find(
            (transaction) => String(transaction.id) === String(routeTransactionId)
        ) || null;
    }, [categories, isAllocatorMode, isLoading, routeTransactionId, transactions]);
    const linkedAllocationBaseTransfer = useMemo(() => {
        if (!routeTransaction || !isSalaryTransaction(routeTransaction, categories)) {
            return null;
        }

        return transactions.find((transaction) =>
            isSalaryAllocationBase(transaction)
            && String(transaction.source_salary_transaction_id || "") === String(routeTransaction.id)
        ) || null;
    }, [categories, routeTransaction, transactions]);
    const sourceTransaction = useMemo(() => {
        if (!routeTransaction) {
            return null;
        }

        if (isSalaryAllocationBase(routeTransaction)) {
            return routeTransaction;
        }

        if (isSalaryTransaction(routeTransaction, categories)) {
            return linkedAllocationBaseTransfer ? null : routeTransaction;
        }

        return null;
    }, [categories, linkedAllocationBaseTransfer, routeTransaction]);
    useEffect(() => {
        if (!isAllocatorMode || isLoading || !linkedAllocationBaseTransfer) {
            return;
        }

        navigate(`/salary-allocator/${linkedAllocationBaseTransfer.id}`, { replace: true });
    }, [isAllocatorMode, isLoading, linkedAllocationBaseTransfer, navigate]);

    useEffect(() => {
        if (sourceTransaction) {
            setSelectedUser(String(sourceTransaction.user || users[0]?.name || ""));
            setSalaryAmount(String(sourceTransaction.amount ?? ""));
            return;
        }

        if (!isAllocatorMode && !selectedUser && users[0]?.name) {
            setSelectedUser(users[0].name);
        }
    }, [isAllocatorMode, selectedUser, sourceTransaction, users]);

    const userAllocations = useMemo(
        () => [...salaryAllocations].sort((left, right) => Number(left.id || 0) - Number(right.id || 0)),
        [salaryAllocations]
    );

    useEffect(() => {
        if (!selectedUser) {
            return;
        }

        const defaultAllocation = getDefaultAllocation(userAllocations);
        setSelectedAllocationId((current) => {
            if (current && userAllocations.some((allocation) => String(allocation.id) === String(current))) {
                return current;
            }
            return String(defaultAllocation?.id || "");
        });
    }, [selectedUser, userAllocations]);

    const selectedAllocation = useMemo(
        () => userAllocations.find((allocation) => String(allocation.id) === String(selectedAllocationId)) || null,
        [selectedAllocationId, userAllocations]
    );

    const selectedAllocationItems = useMemo(
        () => getAllocationItems(selectedAllocationId, salaryAllocationItems),
        [salaryAllocationItems, selectedAllocationId]
    );

    const validationError = useMemo(
        () => validateAllocationItems(selectedAllocationItems),
        [selectedAllocationItems]
    );

    const breakdown = useMemo(() => {
        if (!selectedAllocationItems.length || validationError || Number(salaryAmount || 0) <= 0) {
            return [];
        }

        return computeSalaryBreakdown(salaryAmount, selectedAllocationItems);
    }, [salaryAmount, selectedAllocationItems, validationError]);

    const pieData = useMemo(() => toPieChartData(breakdown), [breakdown]);

    const accountNameById = useMemo(
        () => new Map(accounts.map((account) => [String(account.id), account.name])),
        [accounts]
    );
    const expenseCategories = useMemo(
        () => categories.filter((category) => String(category.type || "").toLowerCase() === "expense"),
        [categories]
    );

    const breakdownWithAllocation = useMemo(
        () => breakdown.map((item) => {
            const allocatedAmount = sourceTransaction
                ? Number(getAllocatedAmountForItem(transactions, sourceTransaction.id, item.id).toFixed(2))
                : 0;

            return {
                ...item,
                allocatedAmount,
                remainingAmount: Number(Math.max(item.amount - allocatedAmount, 0).toFixed(2))
            };
        }),
        [breakdown, sourceTransaction, transactions]
    );
    const currentSourceHistory = useMemo(
        () => salaryAllocationHistory.filter(
            (item) => String(item.source_transaction_id || "") === String(sourceTransaction?.id || "")
        ),
        [salaryAllocationHistory, sourceTransaction]
    );
    const fromAccount = sourceTransaction?.is_salary_allocation_base === 1 ? sourceTransaction?.transfer_account_id : sourceTransaction?.account_id;
    const fromAccountName = accountNameById.get(String(fromAccount || "")) || "Unknown account";

    function openAllocationDialog(item) {
        setAllocationDialogItem(item);
        setAllocationForm({
            type: "expense",
            category_id: "",
            transfer_account_id: "",
            tags: [],
            note: `Allocated from Salary #${sourceTransaction?.id || ""} - ${item.label}`
        });
    }

    function closeAllocationDialog() {
        if (isSaving) {
            return;
        }

        setAllocationDialogItem(null);
        setAllocationForm({
            type: "expense",
            category_id: "",
            transfer_account_id: "",
            tags: [],
            note: ""
        });
        setIsTagsMenuOpen(false);
    }

    async function handleAllocateSubmit() {
        if (!sourceTransaction || !allocationDialogItem) {
            return;
        }

        const payload = {
            date: getTodayInAppTimeZone(),
            type: allocationForm.type,
            category_id: allocationForm.type === "expense" ? String(allocationForm.category_id || "") : "",
            account_id: sourceTransaction?.is_salary_allocation_base === 1
                ? String(sourceTransaction?.transfer_account_id || "")
                : String(sourceTransaction.account_id || ""),
            transfer_account_id: allocationForm.type === "transfer"
                ? String(allocationForm.transfer_account_id || "")
                : "",
            transfer_fee: 0,
            amount: Number(allocationDialogItem.remainingAmount || 0),
            note: String(allocationForm.note || ""),
            tags: allocationForm.tags.length <= 1
                ? String(allocationForm.tags[0] || "")
                : allocationForm.tags.join(","),
            user: String(sourceTransaction.user || ""),
            source_salary_transaction_id: String(sourceTransaction.id || ""),
            salary_allocation_item_id: String(allocationDialogItem.id || ""),
            is_salary_allocation_base: 0
        };

        if (payload.type === "expense" && !payload.category_id) {
            setError("Select a category.");
            return;
        }

        if (payload.type === "transfer" && !payload.transfer_account_id) {
            setError("Select a destination account.");
            return;
        }

        if (
            payload.type === "transfer"
            && String(payload.account_id) === String(payload.transfer_account_id)
        ) {
            setError("Transfer destination must be different from the source account.");
            return;
        }

        setIsSaving(true);
        setError("");
        setMessage("");

        try {
            const result = await postData("addTransaction", payload);
            saveTransactionLocally({
                ...payload,
                id: String(result.id ?? "")
            });
            const historyResult = await postData("addSalaryAllocationHistory", {
                source_transaction_id: String(sourceTransaction.id || ""),
                allocation_id: String(selectedAllocationId || ""),
                allocation_item_id: String(allocationDialogItem.id || ""),
                allocated_transaction_id: String(result.id ?? ""),
                user: String(sourceTransaction.user || ""),
                type: String(payload.type || ""),
                amount: Number(payload.amount || 0),
                account_id: String(payload.account_id || ""),
                transfer_account_id: String(payload.transfer_account_id || ""),
                note: String(payload.note || ""),
                allocated_at: String(payload.date || "")
            });
            saveSalaryAllocationHistoryLocally({
                id: String(historyResult.id ?? ""),
                source_transaction_id: String(sourceTransaction.id || ""),
                allocation_id: String(selectedAllocationId || ""),
                allocation_item_id: String(allocationDialogItem.id || ""),
                allocated_transaction_id: String(result.id ?? ""),
                user: String(sourceTransaction.user || ""),
                type: String(payload.type || ""),
                amount: Number(payload.amount || 0),
                account_id: String(payload.account_id || ""),
                transfer_account_id: String(payload.transfer_account_id || ""),
                note: String(payload.note || ""),
                allocated_at: String(payload.date || "")
            });
            setMessage(`Allocated ${allocationDialogItem.label}.`);
            setAllocationDialogItem(null);
            setAllocationForm({
                type: "expense",
                category_id: "",
                transfer_account_id: "",
                tags: [],
                note: ""
            });
            setIsTagsMenuOpen(false);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.35rem", sm: "1.7rem" } }}>
                    Salary Allocator
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Break down your salary using saved percentages.
                </Typography>
            </Stack>

            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: { xs: 2, md: 2.5 } }}>
                <Stack spacing={2}>
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr auto" },
                            alignItems: "end"
                        }}
                    >
                        <TextField
                            label="Salary Amount"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: "0.01" }}
                            value={salaryAmount}
                            onChange={(event) => setSalaryAmount(event.target.value)}
                            disabled={isAllocatorMode}
                            fullWidth
                        />
                        <FormControl fullWidth size="small" disabled={!userAllocations.length}>
                            <InputLabel>Allocation Preset</InputLabel>
                            <Select
                                label="Allocation Preset"
                                value={selectedAllocationId}
                                onChange={(event) => setSelectedAllocationId(event.target.value)}
                                disabled={currentSourceHistory.length > 0}
                            >
                                {userAllocations.map((allocation) => (
                                    <MenuItem key={allocation.id} value={String(allocation.id)}>{allocation.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            onClick={() => setIsEditDialogOpen(true)}
                            sx={{
                                bgcolor: "#4a6555",
                                "&:hover": {
                                    bgcolor: "#3f594b"
                                }
                            }}
                        >
                            Edit Allocations
                        </Button>
                    </Box>
                    <Box>
                        <Typography variant="body1" sx={{fontSize: "0.6em"}}>
                            {selectedAllocation?.name + " (" + selectedAllocationItems.map((item) => item.label + ": " + item.percentage + "%").join(" | ") + ")"}
                        </Typography>
                    </Box>

                    {!selectedAllocation ? (
                        <Alert severity="info">
                            No allocation set found for this user. Create one using Edit Allocations.
                        </Alert>
                    ) : null}
                    {selectedAllocation && validationError ? (
                        <Alert severity="warning">{validationError}</Alert>
                    ) : null}
                    {isAllocatorMode && sourceTransaction ? (
                        <Alert severity="success">
                            Allocating salary transaction #{sourceTransaction.id} from {sourceTransaction.date} in {accountNameById.get(String(sourceTransaction.account_id)) || "Unknown account"}.
                        </Alert>
                    ) : null}
                    {isAllocatorMode && !isLoading && !linkedAllocationBaseTransfer && !sourceTransaction ? (
                        <Alert severity="error">
                            Invalid allocator transaction. Use a valid Salary income or allocation-base transfer transaction ID.
                        </Alert>
                    ) : null}
                    {!isAllocatorMode ? (
                        <Alert severity="info">
                            Calculator mode is active.
                        </Alert>
                    ) : null}
                </Stack>
            </Card>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.9fr" }
                }}
            >
                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
                    <PieChart
                        data={pieData}
                        seriesName="Salary Allocation"
                        emptyMessage="Enter a salary amount and configure allocations to see the breakdown."
                    />
                </Paper>

                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
                    <Stack spacing={1.25}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Breakdown
                        </Typography>
                        {breakdownWithAllocation.length ? breakdownWithAllocation.map((item) => (
                            <Stack
                                key={item.id}
                                direction="row"
                                justifyContent="space-between"
                                spacing={2}
                                alignItems="center"
                            >
                                <Box>
                                    <Typography fontWeight={600}>{item.label} ({Number(item.percentage).toFixed(2)}%)</Typography>
                                    {sourceTransaction ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Allocated {formatCurrency(item.allocatedAmount)}
                                        </Typography>
                                    ) : null}
                                </Box>
                                <Stack direction="row" spacing={1.25} alignItems="center">
                                    <Typography fontWeight={700}>
                                        {formatCurrency(item.amount)}
                                    </Typography>
                                    {sourceTransaction ? (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            disabled={item.remainingAmount <= 0}
                                            onClick={() => openAllocationDialog(item)}
                                        >
                                            {item.remainingAmount > 0 ? "Allocate" : "Allocated"}
                                        </Button>
                                    ) : null}
                                </Stack>
                            </Stack>
                        )) : (
                            <Typography color="text.secondary">
                                No breakdown available yet.
                            </Typography>
                        )}
                    </Stack>
                </Paper>
            </Box>

            <EditSalaryAllocationsDialog
                open={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                allocation={selectedAllocation}
                allocationItems={selectedAllocationItems}
                onSaved={(savedAllocation) => {
                    setSelectedAllocationId(String(savedAllocation.id || ""));
                }}
                saveSalaryAllocationLocally={saveSalaryAllocationLocally}
                saveSalaryAllocationItemLocally={saveSalaryAllocationItemLocally}
                removeSalaryAllocationItemLocally={removeSalaryAllocationItemLocally}
                setMessage={setMessage}
                setIsSaving={setIsSaving}
                isSaving={isSaving}
            />

            {sourceTransaction ? (
                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
                    <Stack spacing={1.25}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Allocation History
                        </Typography>
                        {currentSourceHistory
                            .sort((left, right) => String(right.allocated_at || "").localeCompare(String(left.allocated_at || "")))
                            .map((item) => (
                                <Stack key={item.id} direction="row" justifyContent="space-between" spacing={2}>
                                    <Box>
                                        <Typography fontWeight={600}>
                                            {item.type === "transfer" ? "Transfer" : "Expense"} • {formatCurrency(item.amount)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.allocated_at || ""} • {item.note || "No note"}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        #{item.allocated_transaction_id}
                                    </Typography>
                                </Stack>
                            ))}
                        {!currentSourceHistory.length ? (
                            <Typography color="text.secondary">
                                No allocation history yet.
                            </Typography>
                        ) : null}
                    </Stack>
                </Paper>
            ) : null}

            <AllocateAmountDialog
                open={Boolean(allocationDialogItem)}
                onClose={closeAllocationDialog}
                onAllocate={handleAllocateSubmit}
                allocationDialogItem={allocationDialogItem}
                allocationForm={allocationForm}
                setAllocationForm={setAllocationForm}
                isSaving={isSaving}
                sourceTransaction={sourceTransaction}
                fromAccount={fromAccount}
                fromAccountName={fromAccountName}
                selectedAllocateAmount={allocationDialogItem?.remainingAmount}
                expenseCategories={expenseCategories}
                accounts={accounts}
                accountTypes={accountTypes}
                users={users}
                accountNameById={accountNameById}
                tags={tags}
                isTagsMenuOpen={isTagsMenuOpen}
                setIsTagsMenuOpen={setIsTagsMenuOpen}
                formatCurrency={formatCurrency}
            />
        </Stack>
    );
}
