import { useMemo, useState } from "react";
import {
    Box, Button, Chip, Dialog, DialogContent, DialogTitle, FormControl,
    IconButton, InputLabel, ListItemIcon, ListItemText, Menu, MenuItem,
    OutlinedInput, Paper, Select, Skeleton, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TableSortLabel, TextField, Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TableSkeleton } from "../components/Skeletons";

export function RecentTransactionsSection({
    isViewLoading,
    formatDate,
    formatCurrency,
    categoryNameById,
    tagNameById,
    transactionForm,
    setTransactionForm,
    isSaving,
    filteredCategories,
    users,
    transactionFormTagIds,
    tags,
    handleTransactionSubmit,
    resetTransactionForm,
    handleDelete,
    toPickerValue,
    visibleTransactions,
    maxId
}) {
    const [showAllTransactions, setShowAllTransactions] = useState(false);
    const [transactionSort, setTransactionSort] = useState({ key: "date", direction: "desc" });
    const [transactionMenuAnchor, setTransactionMenuAnchor] = useState(null);
    const [activeTransaction, setActiveTransaction] = useState(null);
    const [showInlineTransactionEditor, setShowInlineTransactionEditor] = useState(false);
    const [deletingTransactionId, setDeletingTransactionId] = useState("");

    const sortedTransactions = useMemo(() => {
        const items = [...visibleTransactions];
        items.sort((left, right) => {
            if (transactionSort.key === "category") {
                const leftName = categoryNameById.get(String(left.category_id)) || "Unknown";
                const rightName = categoryNameById.get(String(right.category_id)) || "Unknown";
                return transactionSort.direction === "asc"
                    ? leftName.localeCompare(rightName)
                    : rightName.localeCompare(leftName);
            }
            if (transactionSort.key === "amount") {
                return transactionSort.direction === "asc"
                    ? Number(left.amount) - Number(right.amount)
                    : Number(right.amount) - Number(left.amount);
            }
            return transactionSort.direction === "asc"
                ? new Date(left.date) - new Date(right.date)
                : new Date(right.date) - new Date(left.date);
        });
        return items;
    }, [visibleTransactions, transactionSort, categoryNameById]);

    const latestTransactions = useMemo(
        () => [...visibleTransactions].sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 5),
        [visibleTransactions]
    );

    function toggleTransactionSort(key) {
        setTransactionSort((current) => {
            if (current.key === key) {
                return { key, direction: current.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: key === "category" ? "asc" : "desc" };
        });
    }

    function renderTagBadges(tagValues) {
        if (!tagValues?.length) {
            return <Typography variant="body2" color="text.secondary">-</Typography>;
        }

        return (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                {tagValues.map((tagValue, index) => (
                    <Chip
                        key={`${tagValue}-${index}`}
                        label={tagNameById.get(String(tagValue)) || String(tagValue)}
                        size="small"
                        color="secondary"
                        variant="outlined"
                    />
                ))}
            </Stack>
        );
    }

    function openTransactionMenu(event, transaction) {
        setTransactionMenuAnchor(event.currentTarget);
        setActiveTransaction(transaction);
    }

    function closeTransactionMenu() {
        setTransactionMenuAnchor(null);
        setActiveTransaction(null);
    }

    async function deleteTransactionRow(id) {
        setDeletingTransactionId(String(id));
        try {
            await handleDelete("deleteTransaction", id);
        } finally {
            setDeletingTransactionId("");
        }
    }

    async function submitInlineTransaction() {
        const saved = await handleTransactionSubmit(maxId + 1);
        if (saved) {
            setShowInlineTransactionEditor(false);
        }
    }

    function openNewTransactionRow() {
        resetTransactionForm();
        setShowInlineTransactionEditor(true);
    }

    function cancelInlineTransaction() {
        resetTransactionForm();
        setShowInlineTransactionEditor(false);
    }

    function renderInlineTransactionRow() {
        return (
            <TableRow>
                <TableCell colSpan={7}>
                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, padding: 3 }}>
                        <DatePicker
                            label="Date"
                            value={toPickerValue(transactionForm.date)}
                            onChange={(value) => setTransactionForm({ ...transactionForm, date: value ? value.format("MM/DD/YYYY") : "" })}
                            disabled={isSaving}
                            slotProps={{ textField: { fullWidth: true, required: true, size: "small" } }}
                        />
                        <FormControl fullWidth size="small" disabled={isSaving}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                label="Type"
                                value={transactionForm.type}
                                onChange={(event) => setTransactionForm({ ...transactionForm, type: event.target.value, category_id: "" })}
                            >
                                <MenuItem value="expense">Expense</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small" disabled={isSaving}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                label="Category"
                                value={String(transactionForm.category_id ?? "")}
                                onChange={(event) => setTransactionForm({ ...transactionForm, category_id: event.target.value })}
                            >
                                <MenuItem value="">Select a category</MenuItem>
                                {filteredCategories.map((category) => (
                                    <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Amount"
                            type="number"
                            size="small"
                            inputProps={{ min: 0, step: "0.01" }}
                            value={transactionForm.amount}
                            onChange={(event) => setTransactionForm({ ...transactionForm, amount: event.target.value })}
                            disabled={isSaving}
                            required
                            fullWidth
                        />
                        <FormControl fullWidth size="small" disabled={isSaving}>
                            <InputLabel>User</InputLabel>
                            <Select
                                label="User"
                                value={transactionForm.user}
                                onChange={(event) => setTransactionForm({ ...transactionForm, user: event.target.value })}
                            >
                                <MenuItem value="">All</MenuItem>
                                {users.map((user) => (
                                    <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small" disabled={isSaving}>
                            <InputLabel>Tags</InputLabel>
                            <Select
                                multiple
                                value={transactionFormTagIds}
                                onChange={(event) => setTransactionForm({ ...transactionForm, tags: event.target.value })}
                                input={<OutlinedInput label="Tags" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={tagNameById.get(String(value)) || String(value)} size="small" />
                                        ))}
                                    </Box>
                                )}
                            >
                                {tags.map((tag) => (
                                    <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Note"
                            multiline
                            minRows={2}
                            fullWidth
                            size="small"
                            disabled={isSaving}
                            value={transactionForm.note}
                            onChange={(event) => setTransactionForm({ ...transactionForm, note: event.target.value })}
                            sx={{ gridColumn: { md: "1 / -1" } }}
                        />
                        <Stack direction="row" spacing={1.5} sx={{ gridColumn: { md: "1 / -1" } }}>
                            <Button
                                variant="contained"
                                onClick={submitInlineTransaction}
                                disabled={isSaving || !transactionForm.date || !transactionForm.category_id || !transactionForm.amount}
                            >
                                {isSaving ? "Saving..." : transactionForm.id ? "Save" : "Add"}
                            </Button>
                            <Button variant="outlined" onClick={cancelInlineTransaction} disabled={isSaving}>
                                Cancel
                            </Button>
                        </Stack>
                    </Box>
                </TableCell>
            </TableRow>
        );
    }

    function renderTransactionTableRows(items) {
        return items.map((transaction) => (
            String(transaction.id) === deletingTransactionId ? (
                <TableRow key={transaction.id}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell align="right"><Skeleton width={28} /></TableCell>
                </TableRow>
            ) : (
                <TableRow key={transaction.id} hover>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                        {categoryNameById.get(String(transaction.category_id)) || "Unknown"}
                        {renderTagBadges(transaction.tags)}
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{transaction.user || "All"}</TableCell>
                    <TableCell>{transaction.note || "-"}</TableCell>
                    <TableCell align="right">
                        <IconButton onClick={(event) => openTransactionMenu(event, transaction)} aria-label="Open transaction actions">
                            <MoreVertRoundedIcon />
                        </IconButton>
                    </TableCell>
                </TableRow>
            )
        ));
    }

    return (
        <>
            <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Recent transactions</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={openNewTransactionRow}
                        disabled={showInlineTransactionEditor}
                    >
                        Add Entry
                    </Button>
                </Stack>
                {isViewLoading ? (
                    <TableSkeleton rows={5} columns={7} />
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Category/Tags</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>User</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {showInlineTransactionEditor ? renderInlineTransactionRow() : null}
                                    {latestTransactions.length ? renderTransactionTableRows(latestTransactions) : (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">No transactions found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                            <Button variant="outlined" onClick={() => setShowAllTransactions(true)}>Show All</Button>
                        </Stack>
                    </>
                )}
            </Paper>

            <Dialog open={showAllTransactions} onClose={() => setShowAllTransactions(false)} fullWidth maxWidth="xl">
                <DialogTitle>All Transactions</DialogTitle>
                <DialogContent dividers>
                    {isViewLoading ? (
                        <TableSkeleton rows={8} columns={8} />
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell sortDirection={transactionSort.key === "category" ? transactionSort.direction : false}>
                                            <TableSortLabel
                                                active={transactionSort.key === "category"}
                                                direction={transactionSort.key === "category" ? transactionSort.direction : "asc"}
                                                onClick={() => toggleTransactionSort("category")}
                                            >
                                                Category/Tags
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sortDirection={transactionSort.key === "amount" ? transactionSort.direction : false}>
                                            <TableSortLabel
                                                active={transactionSort.key === "amount"}
                                                direction={transactionSort.key === "amount" ? transactionSort.direction : "asc"}
                                                onClick={() => toggleTransactionSort("amount")}
                                            >
                                                Amount
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>User</TableCell>
                                        <TableCell>Note</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedTransactions.length ? renderTransactionTableRows(sortedTransactions, { showNotes: true }) : (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">No transactions found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
            </Dialog>

            <Menu
                anchorEl={transactionMenuAnchor}
                open={Boolean(transactionMenuAnchor)}
                onClose={closeTransactionMenu}
            >
                <MenuItem
                    onClick={(event) => {
                        event.currentTarget.blur();
                        const transactionToEdit = activeTransaction;
                        closeTransactionMenu();

                        if (transactionToEdit) {
                            setTransactionForm(transactionToEdit);
                            setShowInlineTransactionEditor(true);
                        }
                    }}
                >
                    <ListItemIcon>
                        <EditRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={(event) => {
                        event.currentTarget.blur();
                        const transactionToDelete = activeTransaction;
                        closeTransactionMenu();

                        if (transactionToDelete) {
                            void deleteTransactionRow(transactionToDelete.id);
                        }
                    }}
                >
                    <ListItemIcon>
                        <DeleteRoundedIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}
