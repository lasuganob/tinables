import { useMemo, useState } from "react";
import {
    Box, Button, Checkbox, Chip, FormControl, FormControlLabel,
    InputLabel, ListSubheader, MenuItem, OutlinedInput, Paper,
    Select, Stack, TextField, Typography,
    useMediaQuery, useTheme
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MoneyIcon from "@mui/icons-material/Money";
import SavingsIcon from "@mui/icons-material/Savings";

function AccountTypeIcon({ typeName }) {
    if (typeName === "cash") return <MoneyIcon />;
    if (typeName === "e-wallet") return <AccountBalanceWalletIcon />;
    if (typeName === "bank") return <AccountBalanceIcon />;
    if (typeName === "savings") return <SavingsIcon />;
    return null;
}

function renderAccountOptionItems(items, formatCurrency) {
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
            {account.balance ? (
                <Chip
                    color="primary"
                    variant="outlined"
                    size="small"
                    label={formatCurrency(account.balance)}
                    sx={{ ml: 1 }}
                />
            ) : null}
        </MenuItem>
    ));
}

export function TransactionEditor({
    transactionForm,
    setTransactionForm,
    isSaving,
    filteredCategories,
    accounts,
    accountTypes,
    users,
    transactionFormTagIds,
    tags,
    formatDate,
    formatCurrency,
    accountNameById,
    tagNameById,
    toPickerValue,
    allTransactions,
    allCategories,
    onSubmit,
    onCancel,
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [isTagsMenuOpen, setIsTagsMenuOpen] = useState(false);

    const userNameById = useMemo(
        () => new Map(users.map((user) => [String(user.id), user.name])),
        [users]
    );

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
                groups.set(typeKey, { typeKey, typeName, accounts: [] });
            }
            groups.get(typeKey).accounts.push(account);
        });

        return [...groups.values()].sort((left, right) =>
            left.typeName.localeCompare(right.typeName)
        );
    }, [accountOptionsWithUser, accountTypes]);

    const salaryCategoryIds = useMemo(
        () => new Set(
            (allCategories || [])
                .filter((category) =>
                    String(category.type || "").toLowerCase() === "income"
                    && String(category.name || "").trim().toLowerCase() === "salary"
                )
                .map((category) => String(category.id))
        ),
        [allCategories]
    );

    const salaryIncomeOptions = useMemo(
        () => (allTransactions || [])
            .filter((transaction) =>
                String(transaction.type || "").toLowerCase() === "income"
                && String(transaction.user || "") === String(transactionForm.user || "")
                && salaryCategoryIds.has(String(transaction.category_id || ""))
            )
            .sort((left, right) => {
                if (String(left.date || "") !== String(right.date || "")) {
                    return String(right.date || "").localeCompare(String(left.date || ""));
                }
                return Number(right.id || 0) - Number(left.id || 0);
            }),
        [allTransactions, salaryCategoryIds, transactionForm.user]
    );

    const isTransfer = transactionForm.type === "transfer";

    const transferDetails = isTransfer ? (
        <Paper
            elevation={0}
            sx={{
                gridColumn: { md: "1 / -1" },
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "rgba(74,101,85,0.04)"
            }}
        >
            <Stack spacing={1.25}>
                <Typography variant="subtitle2" fontWeight={700}>
                    Transfer Details
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gap: { xs: 1.25, sm: 1.5 },
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }
                    }}
                >
                    <FormControl fullWidth size="small" disabled={isSaving} required>
                        <InputLabel required>From Account</InputLabel>
                        <Select
                            label="From Account"
                            value={String(transactionForm.account_id ?? "")}
                            onChange={(event) => setTransactionForm({ ...transactionForm, account_id: event.target.value })}
                            required
                        >
                            <MenuItem value="">Select an account</MenuItem>
                            {groupedAccountOptions.map((group) => ([
                                <ListSubheader key={`from-header-${group.typeKey}`} sx={{ textTransform: "capitalize", display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
                                    <AccountTypeIcon typeName={group.typeName} />
                                    {group.typeName}
                                </ListSubheader>,
                                ...renderAccountOptionItems(group.accounts, formatCurrency)
                            ]))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" disabled={isSaving} required>
                        <InputLabel required>To Account</InputLabel>
                        <Select
                            label="To Account"
                            value={String(transactionForm.transfer_account_id ?? "")}
                            onChange={(event) => setTransactionForm({ ...transactionForm, transfer_account_id: event.target.value })}
                            required
                        >
                            <MenuItem value="">Select an account</MenuItem>
                            {groupedAccountOptions.map((group) => {
                                const eligibleAccounts = group.accounts.filter(
                                    (account) => String(account.id) !== String(transactionForm.account_id)
                                );
                                if (!eligibleAccounts.length) return null;
                                return [
                                    <ListSubheader key={`to-header-${group.typeKey}`} sx={{ textTransform: "capitalize", display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
                                        <AccountTypeIcon typeName={group.typeName} />
                                        {group.typeName}
                                    </ListSubheader>,
                                    ...renderAccountOptionItems(eligibleAccounts, formatCurrency)
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

                    <FormControl fullWidth size="small" disabled={isSaving}>
                        <InputLabel>Linked Salary Income</InputLabel>
                        <Select
                            label="Linked Salary Income"
                            value={String(transactionForm.source_salary_transaction_id ?? "")}
                            onChange={(event) => setTransactionForm({
                                ...transactionForm,
                                source_salary_transaction_id: event.target.value
                            })}
                        >
                            <MenuItem value="">None</MenuItem>
                            {salaryIncomeOptions.map((transaction) => (
                                <MenuItem key={transaction.id} value={String(transaction.id)}>
                                    {`${formatDate(transaction.date)} • ${formatCurrency(transaction.amount)}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <FormControlLabel
                    control={(
                        <Checkbox
                            checked={Number(transactionForm.is_salary_allocation_base || 0) === 1}
                            disabled={!transactionForm.source_salary_transaction_id}
                            onChange={(event) => setTransactionForm({
                                ...transactionForm,
                                is_salary_allocation_base: event.target.checked ? 1 : 0
                            })}
                        />
                    )}
                    label="Use this transfer as allocation base"
                />
                <Typography variant="body2" color="text.secondary">
                    <b>NOTE:</b> Linked Salary Income is a transaction you want to link to this salary transfer. Leave blank if it&apos;s just a regular transfer.
                </Typography>
            </Stack>
        </Paper>
    ) : null;

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
                    onChange={(event) => setTransactionForm({
                        ...transactionForm,
                        type: event.target.value,
                        category_id: "",
                        source_salary_transaction_id: event.target.value === "transfer"
                            ? transactionForm.source_salary_transaction_id
                            : "",
                        salary_allocation_item_id: event.target.value === "expense"
                            ? transactionForm.salary_allocation_item_id
                            : "",
                        is_salary_allocation_base: event.target.value === "transfer"
                            ? transactionForm.is_salary_allocation_base
                            : 0
                    })}
                    required
                >
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                </Select>
            </FormControl>

            {!isTransfer ? (
                <FormControl fullWidth size="small" disabled={isSaving} required>
                    <InputLabel required>Account</InputLabel>
                    <Select
                        label="Account"
                        value={String(transactionForm.account_id ?? "")}
                        onChange={(event) => setTransactionForm({ ...transactionForm, account_id: event.target.value })}
                        required
                    >
                        <MenuItem value="">Select an account</MenuItem>
                        {groupedAccountOptions.map((group) => ([
                            <ListSubheader key={`account-header-${group.typeKey}`} sx={{ textTransform: "capitalize", display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
                                <AccountTypeIcon typeName={group.typeName} />
                                {group.typeName}
                            </ListSubheader>,
                            ...renderAccountOptionItems(group.accounts, formatCurrency)
                        ]))}
                    </Select>
                </FormControl>
            ) : null}

            {!isTransfer ? (
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
            ) : null}

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

            {transferDetails}

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
                        PaperProps: { sx: { maxHeight: 320 } },
                        MenuListProps: { sx: { pb: 0 } }
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
                    onClick={onSubmit}
                    disabled={
                        isSaving
                        || !transactionForm.date
                        || !transactionForm.amount
                        || !transactionForm.account_id
                        || (!isTransfer && !transactionForm.category_id)
                        || (isTransfer && (!transactionForm.transfer_account_id || transactionForm.transfer_account_id === transactionForm.account_id))
                        || (isTransfer && Number(transactionForm.is_salary_allocation_base || 0) === 1 && !transactionForm.source_salary_transaction_id)
                    }
                    fullWidth={isMobile}
                    sx={{
                        bgcolor: "#4a6555",
                        "&:hover": { bgcolor: "#3f594b" }
                    }}
                >
                    {isSaving ? "Saving..." : transactionForm.id ? "Save Entry" : "Add Entry"}
                </Button>
                <Button
                    variant="outlined"
                    onClick={onCancel}
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
