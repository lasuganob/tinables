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
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart } from "../components/PieChart";
import { EditSalaryAllocationsDialog } from "../components/EditSalaryAllocationsDialog";
import { useAppDataContext, useAppFeedbackContext } from "../context/AppDataContext";
import { formatCurrency } from "../lib/format";
import {
    computeSalaryBreakdown,
    getAllocatedAmountForItem,
    getAllocationItems,
    getDefaultAllocationForUser,
    isSalaryTransaction,
    toPieChartData,
    validateAllocationItems
} from "../utils/salaryAllocator";

function isAllocationBaseTransfer(transaction) {
    return String(transaction?.type || "").toLowerCase() === "transfer"
        && Number(transaction?.is_salary_allocation_base || 0) === 1
        && String(transaction?.source_salary_transaction_id || "");
}

export function SalaryAllocatorPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        salaryAllocations,
        salaryAllocationItems,
        transactions,
        categories,
        accounts,
        users,
        saveSalaryAllocationLocally,
        saveSalaryAllocationItemLocally,
        removeSalaryAllocationItemLocally
    } = useAppDataContext();
    const { setError, setMessage, setIsSaving } = useAppFeedbackContext();
    const [selectedUser, setSelectedUser] = useState("");
    const [salaryAmount, setSalaryAmount] = useState("");
    const [selectedAllocationId, setSelectedAllocationId] = useState("");
    const [selectedSourceTransactionId, setSelectedSourceTransactionId] = useState("");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        const input = location.state?.salaryAllocatorInput;
        if (!input) {
            if (!selectedUser && users[0]?.name) {
                setSelectedUser(users[0].name);
            }
            return;
        }

        setSelectedUser(String(input.user || users[0]?.name || ""));
        setSalaryAmount(String(input.amount ?? ""));
        setSelectedSourceTransactionId(String(input.sourceTransactionId || ""));
    }, [location.state, selectedUser, users]);

    const allocationSourceOptions = useMemo(() => {
        const linkedTransferBySalaryId = new Map();

        transactions.forEach((transaction) => {
            if (
                String(transaction.user || "") === String(selectedUser || "")
                && isAllocationBaseTransfer(transaction)
            ) {
                linkedTransferBySalaryId.set(String(transaction.source_salary_transaction_id), transaction);
            }
        });

        const sources = transactions.filter((transaction) => {
            if (String(transaction.user || "") !== String(selectedUser || "")) {
                return false;
            }

            if (isAllocationBaseTransfer(transaction)) {
                return true;
            }

            if (!isSalaryTransaction(transaction, categories)) {
                return false;
            }

            return !linkedTransferBySalaryId.has(String(transaction.id));
        });

        const selectedTransaction = transactions.find(
            (transaction) => String(transaction.id) === String(selectedSourceTransactionId)
        );

        return (selectedTransaction
            && !sources.some((transaction) => String(transaction.id) === String(selectedTransaction.id))
            ? [...sources, selectedTransaction]
            : sources)
            .sort((left, right) => {
                if (String(left.date || "") !== String(right.date || "")) {
                    return String(right.date || "").localeCompare(String(left.date || ""));
                }

                return Number(right.id || 0) - Number(left.id || 0);
            });
    }, [categories, selectedSourceTransactionId, selectedUser, transactions]);

    const userAllocations = useMemo(
        () => salaryAllocations
            .filter((allocation) => String(allocation.user || "") === String(selectedUser || ""))
            .sort((left, right) => Number(left.id || 0) - Number(right.id || 0)),
        [salaryAllocations, selectedUser]
    );

    useEffect(() => {
        if (!selectedUser) {
            return;
        }

        const defaultAllocation = getDefaultAllocationForUser(selectedUser, userAllocations);
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

    const sourceTransaction = useMemo(
        () => allocationSourceOptions.find((transaction) => String(transaction.id) === String(selectedSourceTransactionId)) || null,
        [allocationSourceOptions, selectedSourceTransactionId]
    );

    const breakdownWithAllocation = useMemo(
        () => breakdown.map((item) => {
            const allocatedAmount = selectedSourceTransactionId
                ? Number(getAllocatedAmountForItem(transactions, selectedSourceTransactionId, item.id).toFixed(2))
                : 0;

            return {
                ...item,
                allocatedAmount,
                remainingAmount: Number(Math.max(item.amount - allocatedAmount, 0).toFixed(2))
            };
        }),
        [breakdown, selectedSourceTransactionId, transactions]
    );

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
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr auto" },
                            alignItems: "end"
                        }}
                    >
                        <FormControl fullWidth size="small">
                            <InputLabel>User</InputLabel>
                            <Select
                                label="User"
                                value={selectedUser}
                                onChange={(event) => setSelectedUser(event.target.value)}
                            >
                                {users.map((user) => (
                                    <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Salary Amount"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: "0.01" }}
                            value={salaryAmount}
                            onChange={(event) => setSalaryAmount(event.target.value)}
                            fullWidth
                        />
                        <FormControl fullWidth size="small" disabled={!userAllocations.length}>
                            <InputLabel>Allocation Preset</InputLabel>
                            <Select
                                label="Allocation Preset"
                                value={selectedAllocationId}
                                onChange={(event) => setSelectedAllocationId(event.target.value)}
                            >
                                {userAllocations.map((allocation) => (
                                    <MenuItem key={allocation.id} value={String(allocation.id)}>{allocation.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                            <InputLabel>Referenced Salary</InputLabel>
                            <Select
                                label="Referenced Salary"
                                value={selectedSourceTransactionId}
                                onChange={(event) => {
                                    const nextTransactionId = String(event.target.value || "");
                                    setSelectedSourceTransactionId(nextTransactionId);

                                    const nextTransaction = allocationSourceOptions.find(
                                        (transaction) => String(transaction.id) === nextTransactionId
                                    );

                                    if (nextTransaction) {
                                        setSalaryAmount(String(nextTransaction.amount ?? ""));
                                    }
                                }}
                            >
                                <MenuItem value="">Calculator only</MenuItem>
                                {allocationSourceOptions.map((transaction) => (
                                    <MenuItem key={transaction.id} value={String(transaction.id)}>
                                        {`${String(transaction.type || "").toLowerCase() === "transfer" ? "Transfer" : "Salary"} • ${transaction.date} • ${formatCurrency(transaction.amount)} • ${accountNameById.get(String(transaction.account_id)) || "Unknown account"} • #${transaction.id}`}
                                    </MenuItem>
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

                    {!selectedAllocation ? (
                        <Alert severity="info">
                            No allocation set found for this user. Create one using Edit Allocations.
                        </Alert>
                    ) : null}
                    {selectedAllocation && validationError ? (
                        <Alert severity="warning">{validationError}</Alert>
                    ) : null}
                    {sourceTransaction ? (
                        <Alert severity="success">
                            Linked to {String(sourceTransaction.type || "").toLowerCase() === "transfer" ? "transfer" : "salary"} transaction #{sourceTransaction.id} from {sourceTransaction.date} in {accountNameById.get(String(sourceTransaction.account_id)) || "Unknown account"}.
                        </Alert>
                    ) : (
                        <Alert severity="info">
                            Calculator mode is active. Select a salary transaction to enable Allocate actions.
                        </Alert>
                    )}
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
                                    <Typography fontWeight={600}>{item.label}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {Number(item.percentage).toFixed(2)}%
                                    </Typography>
                                    {selectedSourceTransactionId ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Allocated {formatCurrency(item.allocatedAmount)} • Remaining {formatCurrency(item.remainingAmount)}
                                        </Typography>
                                    ) : null}
                                </Box>
                                <Stack direction="row" spacing={1.25} alignItems="center">
                                    <Typography fontWeight={700}>
                                        {formatCurrency(item.amount)}
                                    </Typography>
                                    {selectedSourceTransactionId ? (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            disabled={item.remainingAmount <= 0}
                                            onClick={() => {
                                                navigate("/transactions", {
                                                    state: {
                                                        transactionPrefill: {
                                                            type: "expense",
                                                            amount: item.remainingAmount,
                                                            user: selectedUser,
                                                            note: `Allocated from Salary #${selectedSourceTransactionId} - ${item.label}`,
                                                            source_salary_transaction_id: String(selectedSourceTransactionId),
                                                            salary_allocation_item_id: String(item.id)
                                                        }
                                                    }
                                                });
                                            }}
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
                users={users}
                onSaved={(savedAllocation) => {
                    setSelectedUser(String(savedAllocation.user || selectedUser));
                    setSelectedAllocationId(String(savedAllocation.id || ""));
                }}
                saveSalaryAllocationLocally={saveSalaryAllocationLocally}
                saveSalaryAllocationItemLocally={saveSalaryAllocationItemLocally}
                removeSalaryAllocationItemLocally={removeSalaryAllocationItemLocally}
                setError={setError}
                setMessage={setMessage}
                setIsSaving={setIsSaving}
            />
        </Stack>
    );
}
