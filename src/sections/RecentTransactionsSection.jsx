import { useEffect, useMemo, useRef, useState } from "react";
import {
    Box, Button, Chip, FormControl,
    IconButton, InputLabel, ListItemIcon, ListItemText, Menu, MenuItem,
    ListSubheader, OutlinedInput, Paper, Select, Skeleton, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography,
    useMediaQuery, useTheme
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TableSkeleton } from "../components/Skeletons";
import { parseDateValue } from "../lib/format";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MoneyIcon from '@mui/icons-material/Money';
import SavingsIcon from '@mui/icons-material/Savings';

export function RecentTransactionsSection({
    isViewLoading,
    formatDate,
    formatCurrency,
    categoryNameById,
    accountNameById,
    tagNameById,
    transactionForm,
    setTransactionForm,
    isSaving,
    filteredCategories,
    accounts,
    accountTypes,
    users,
    transactionFormTagIds,
    tags,
    handleTransactionSubmit,
    resetTransactionForm,
    handleDelete,
    toPickerValue,
    visibleTransactions,
    transactionEditorTrigger
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [transactionSort, setTransactionSort] = useState({ key: "date", direction: "desc" });
    const [transactionMenuAnchor, setTransactionMenuAnchor] = useState(null);
    const [activeTransaction, setActiveTransaction] = useState(null);
    const [showInlineTransactionEditor, setShowInlineTransactionEditor] = useState(false);
    const [deletingTransactionId, setDeletingTransactionId] = useState("");
    const [isTagsMenuOpen, setIsTagsMenuOpen] = useState(false);
    const userNameById = useMemo(
        () => new Map(users.map((user) => [String(user.id), user.name])),
        [users]
    );

    useEffect(() => {
        if (!showInlineTransactionEditor) {
            return;
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }, [showInlineTransactionEditor]);

    useEffect(() => {
        if (!transactionEditorTrigger) {
            return;
        }

        setShowInlineTransactionEditor(true);
    }, [transactionEditorTrigger]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

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
            const dateDifference = parseDateValue(left.date) - parseDateValue(right.date);
            if (dateDifference !== 0) {
                return transactionSort.direction === "asc"
                    ? dateDifference
                    : -dateDifference;
            }

            const idDifference = Number(left.id) - Number(right.id);
            return transactionSort.direction === "asc"
                ? idDifference
                : -idDifference;
        });
        return items;
    }, [visibleTransactions, transactionSort, categoryNameById]);

    const paginatedTransactions = useMemo(() => {
        const start = page * rowsPerPage;
        return sortedTransactions.slice(start, start + rowsPerPage);
    }, [sortedTransactions, page, rowsPerPage]);

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
        const saved = await handleTransactionSubmit();
        if (saved?.ok) {
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

    const accountOptionsWithUser = useMemo(() => {
        const accountOptions = [...accounts];
        const selectedAccountIds = [
            String(transactionForm.account_id || ""),
            String(transactionForm.transfer_account_id || "")
        ].filter(Boolean);

        selectedAccountIds.forEach((selectedId) => {
            const exists = accountOptions.some((account) => String(account.id) === selectedId);
            if (!exists) {
                accountOptions.push({
                    id: selectedId,
                    name: accountNameById.get(selectedId) || `Account ${selectedId}`
                });
            }
        });

        return accountOptions.map((account) => ({
            ...account,
            userName: userNameById.get(String(account.user)) || ""
        }));
    }, [
        accounts,
        transactionForm.account_id,
        transactionForm.transfer_account_id,
        accountNameById,
        userNameById
    ]);

    const groupedAccountOptions = useMemo(() => {
        const typeNameById = new Map(
            (accountTypes || []).map((accountType) => [String(accountType.id), accountType.name])
        );
        const groups = new Map();

        accountOptionsWithUser.forEach((account) => {
            const typeKey = String(account.type || "");
            const typeName = typeNameById.get(typeKey) || "Other";

            if (!groups.has(typeKey)) {
                groups.set(typeKey, {
                    typeKey,
                    typeName,
                    accounts: []
                });
            }

            groups.get(typeKey).accounts.push(account);
        });

        return [...groups.values()].sort((left, right) =>
            left.typeName.localeCompare(right.typeName)
        );
    }, [accountOptionsWithUser, accountTypes]);

    function renderAccountOptionItems(items) {
        return items.map((account) => (
            <MenuItem key={account.id} value={String(account.id)} sx={{ pl: 4 }}>
                {account.name}
                {account.userName ? (
                    <Chip
                        color={account.user === 1 ? "warning" : "primary"}
                        variant="filled"
                        size="small"
                        label={account.userName}
                        sx={{ ml: 1 }}
                    />
                ) : null}
            </MenuItem>
        ));
    }

    function renderTransactionEditor() {
        const isTransfer = transactionForm.type === "transfer";

        return (
            <Box
                sx={{
                    display: "grid",
                    gap: { xs: 1.25, sm: 1.5, md: 2 },
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" }
                }}
            >
                <DatePicker
                    label="Date"
                    value={toPickerValue(transactionForm.date)}
                    onChange={(value) => setTransactionForm({ ...transactionForm, date: value ? value.format("YYYY-MM-DD") : "" })}
                    disabled={isSaving}
                    slotProps={{ textField: { fullWidth: true, required: true, size: "small" } }}
                />
                <FormControl fullWidth size="small" disabled={isSaving} required>
                    <InputLabel required>Type</InputLabel>
                    <Select
                        label="Type"
                        value={transactionForm.type}
                        onChange={(event) => setTransactionForm({ ...transactionForm, type: event.target.value, category_id: "" })}
                        required
                    >
                        <MenuItem value="expense">Expense</MenuItem>
                        <MenuItem value="income">Income</MenuItem>
                        <MenuItem value="transfer">Transfer</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth size="small" disabled={isSaving} required>
                    <InputLabel required>{isTransfer ? "From Account" : "Account"}</InputLabel>
                    <Select
                        label={isTransfer ? "From Account" : "Account"}
                        value={String(transactionForm.account_id ?? "")}
                        onChange={(event) => setTransactionForm({ ...transactionForm, account_id: event.target.value })}
                        required
                    >
                        <MenuItem value="">Select an account</MenuItem>
                        {groupedAccountOptions.map((group) => ([
                            <ListSubheader key={`from-header-${group.typeKey}`} sx={{ textTransform: "capitalize", display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
                                {group.typeName == "cash" && <MoneyIcon />}
                                {group.typeName == "e-wallet" && <AccountBalanceWalletIcon />}
                                {group.typeName == "bank" && <AccountBalanceIcon />}
                                {group.typeName == "savings" && <SavingsIcon />}
                                {group.typeName}
                            </ListSubheader>,
                            ...renderAccountOptionItems(group.accounts)
                        ]))}
                    </Select>
                </FormControl>
                {isTransfer ? (
                    <>
                        <FormControl fullWidth size="small" disabled={isSaving} required={isTransfer}>
                            <InputLabel required={isTransfer}>To Account</InputLabel>
                            <Select
                                label="To Account"
                                value={String(transactionForm.transfer_account_id ?? "")}
                                onChange={(event) => setTransactionForm({ ...transactionForm, transfer_account_id: event.target.value })}
                                required={isTransfer}
                            >
                                <MenuItem value="">Select an account</MenuItem>
                                {groupedAccountOptions.map((group) => {
                                    const eligibleAccounts = group.accounts.filter(
                                        (account) => String(account.id) !== String(transactionForm.account_id)
                                    );

                                    if (!eligibleAccounts.length) {
                                        return null;
                                    }

                                    return [
                                        <ListSubheader key={`to-header-${group.typeKey}`} sx={{ textTransform: "capitalize", display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
                                            {group.typeName == "cash" && <MoneyIcon />}
                                            {group.typeName == "e-wallet" && <AccountBalanceWalletIcon />}
                                            {group.typeName == "bank" && <AccountBalanceIcon />}
                                            {group.typeName == "savings" && <SavingsIcon />}
                                            {group.typeName}
                                        </ListSubheader>,
                                        ...renderAccountOptionItems(eligibleAccounts)
                                    ];
                                })}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Transfer Fee"
                            type="number"
                            size="small"
                            inputProps={{ min: 0, step: "0.01" }}
                            value={transactionForm.transfer_fee}
                            onChange={(event) => setTransactionForm({ ...transactionForm, transfer_fee: event.target.value })}
                            disabled={isSaving}
                            fullWidth
                        />
                    </>
                ) : (
                    <FormControl fullWidth size="small" disabled={isSaving} required>
                        <InputLabel required>Category</InputLabel>
                        <Select
                            label="Category"
                            value={String(transactionForm.category_id ?? "")}
                            onChange={(event) => setTransactionForm({ ...transactionForm, category_id: event.target.value })}
                            required
                        >
                            <MenuItem value="">Select a category</MenuItem>
                            {filteredCategories.map((category) => (
                                <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
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
                <FormControl fullWidth size="small" disabled={isSaving} required>
                    <InputLabel required>User</InputLabel>
                    <Select
                        label="User"
                        value={transactionForm.user}
                        onChange={(event) => setTransactionForm({ ...transactionForm, user: event.target.value })}
                        required
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
                        open={isTagsMenuOpen}
                        onOpen={() => setIsTagsMenuOpen(true)}
                        onClose={() => setIsTagsMenuOpen(false)}
                        value={transactionFormTagIds}
                        onChange={(event) => setTransactionForm({ ...transactionForm, tags: event.target.value })}
                        input={<OutlinedInput label="Tags" />}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    maxHeight: 320
                                }
                            },
                            MenuListProps: {
                                sx: {
                                    pb: 0
                                }
                            }
                        }}
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
                        <Box sx={{ position: "sticky", bottom: 0, bgcolor: "background.paper", zIndex: 1, p: 1, borderTop: "1px solid", borderColor: "divider" }}>
                            <Button
                                size="small"
                                variant="contained"
                                sx={{ minWidth: 88 }}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setIsTagsMenuOpen(false);
                                }}
                            >
                                OK
                            </Button>
                        </Box>
                    </Select>
                </FormControl>
                <TextField
                    label="Note"
                    multiline
                    minRows={isMobile ? 3 : 2}
                    fullWidth
                    size="small"
                    disabled={isSaving}
                    value={transactionForm.note}
                    onChange={(event) => setTransactionForm({ ...transactionForm, note: event.target.value })}
                    sx={{ gridColumn: { md: "1 / -1" } }}
                />
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    sx={{ gridColumn: { md: "1 / -1" } }}
                >
                    <Button
                        variant="contained"
                        onClick={submitInlineTransaction}
                        disabled={
                            isSaving
                            || !transactionForm.date
                            || !transactionForm.amount
                            || !transactionForm.account_id
                            || (!isTransfer && !transactionForm.category_id)
                            || (isTransfer && (!transactionForm.transfer_account_id || transactionForm.transfer_account_id === transactionForm.account_id))
                        }
                        fullWidth={isMobile}
                        sx={{
                            bgcolor: "#4a6555",
                            "&:hover": {
                                bgcolor: "#3f594b"
                            }
                        }}
                    >
                        {isSaving ? "Saving..." : transactionForm.id ? "Save Entry" : "Add Entry"}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={cancelInlineTransaction}
                        disabled={isSaving}
                        fullWidth={isMobile}
                        sx={{
                            color: "#4a6555",
                            borderColor: "rgba(74,101,85,0.35)",
                            "&:hover": {
                                borderColor: "#4a6555",
                                bgcolor: "rgba(74,101,85,0.08)"
                            }
                        }}
                    >
                        Cancel
                    </Button>
                </Stack>
            </Box>
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
                        {transaction.type === "transfer"
                            ? `Transfer: ${accountNameById.get(String(transaction.account_id)) || "Unknown"} -> ${accountNameById.get(String(transaction.transfer_account_id)) || "Unknown"}`
                            : categoryNameById.get(String(transaction.category_id)) || "Unknown"}
                        {transaction.type === "transfer" && Number(transaction.transfer_fee || 0) > 0 ? (
                            <Typography variant="caption" color="text.secondary" display="block">
                                Fee: {formatCurrency(transaction.transfer_fee)}
                            </Typography>
                        ) : null}
                        {renderTagBadges(transaction.tags)}
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{accountNameById.get(String(transaction.account_id)) || "-"}</TableCell>
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

    function renderMobileTransactionCards(items) {
        if (!items.length) {
            return (
                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">No transactions found.</Typography>
                </Paper>
            );
        }

        return (
            <Stack spacing={1.25}>
                {items.map((transaction) => (
                    String(transaction.id) === deletingTransactionId ? (
                        <Paper key={transaction.id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}>
                            <Stack spacing={1}>
                                <Skeleton width="45%" />
                                <Skeleton />
                                <Skeleton width="60%" />
                            </Stack>
                        </Paper>
                    ) : (
                        <Paper key={transaction.id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 1.5 }}>
                            <Stack spacing={1.25}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(transaction.date)}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {transaction.type === "transfer"
                                                ? `Transfer: ${accountNameById.get(String(transaction.account_id)) || "Unknown"} -> ${accountNameById.get(String(transaction.transfer_account_id)) || "Unknown"}`
                                                : categoryNameById.get(String(transaction.category_id)) || "Unknown"}
                                        </Typography>
                                        {transaction.type === "transfer" && Number(transaction.transfer_fee || 0) > 0 ? (
                                            <Typography variant="caption" color="text.secondary">
                                                Fee: {formatCurrency(transaction.transfer_fee)}
                                            </Typography>
                                        ) : null}
                                    </Stack>
                                    <IconButton
                                        size="small"
                                        onClick={(event) => openTransactionMenu(event, transaction)}
                                        aria-label="Open transaction actions"
                                        sx={{ mt: -0.5, mr: -0.5 }}
                                    >
                                        <MoreVertRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Stack>

                                {transaction.tags?.length ? renderTagBadges(transaction.tags) : null}

                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        {accountNameById.get(String(transaction.account_id)) || "-"}
                                    </Typography>
                                    <Typography variant="subtitle2" fontWeight={800}>
                                        {formatCurrency(transaction.amount)}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between" spacing={1}>
                                    <Typography variant="caption" color="text.secondary">
                                        {transaction.user || "All"}
                                    </Typography>
                                    {transaction.note ? (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ textAlign: "right", maxWidth: "60%" }}
                                        >
                                            {transaction.note}
                                        </Typography>
                                    ) : null}
                                </Stack>
                            </Stack>
                        </Paper>
                    )
                ))}
            </Stack>
        );
    }

    return (
        <>
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                >
                    <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>Transactions</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={openNewTransactionRow}
                        disabled={showInlineTransactionEditor}
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

                {showInlineTransactionEditor ? (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 2,
                            p: { xs: 1.25, sm: 1.5, md: 2 },
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "rgba(15,118,110,0.02)"
                        }}
                    >
                        <Stack spacing={1.25}>
                            <Typography variant="subtitle2" fontWeight={700}>
                                {transactionForm.id ? "Edit transaction" : "New transaction"}
                            </Typography>
                            {renderTransactionEditor()}
                        </Stack>
                    </Paper>
                ) : null}

                {isViewLoading ? (
                    isMobile ? (
                        <Stack spacing={1.25}>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Paper key={index} elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}>
                                    <Stack spacing={1}>
                                        <Skeleton width="45%" />
                                        <Skeleton />
                                        <Skeleton width="60%" />
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                        <TableSkeleton rows={rowsPerPage} columns={7} />
                    )
                ) : (
                    <>
                        {isMobile ? (
                            renderMobileTransactionCards(paginatedTransactions)
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sortDirection={transactionSort.key === "date" ? transactionSort.direction : false}>
                                                <TableSortLabel
                                                    active={transactionSort.key === "date"}
                                                    direction={transactionSort.key === "date" ? transactionSort.direction : "desc"}
                                                    onClick={() => toggleTransactionSort("date")}
                                                >
                                                    Date
                                                </TableSortLabel>
                                            </TableCell>
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
                                            <TableCell>Account</TableCell>
                                            <TableCell>User</TableCell>
                                            <TableCell>Note</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedTransactions.length ? renderTransactionTableRows(paginatedTransactions) : (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">No transactions found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                        <TablePagination
                            rowsPerPageOptions={isMobile ? [5, 10, 15] : [5, 15, 25, 50]}
                            component="div"
                            count={sortedTransactions.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{
                                mt: 1,
                                ".MuiTablePagination-toolbar": {
                                    px: { xs: 0, sm: 2 },
                                    minHeight: { xs: 52, sm: 56 },
                                    flexWrap: "wrap"
                                },
                                ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" }
                                }
                            }}
                        />
                    </>
                )}
            </Paper>

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
