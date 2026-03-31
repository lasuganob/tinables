import { useMemo } from "react";
import { Box, Button, Chip, Divider, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from "@mui/material";
import { useAppDataContext } from "../../context/AppDataContext";
import { useAppFeedbackContext } from "../../context/AppDataContext";
import { useAppFiltersContext } from "../../context/AppFiltersContext";
import { useAccountForm } from "../../hooks/useAccountForm";
import { emptyAccount, fallbackAccountTypes } from "../../constants/defaults";
import { SectionSkeleton } from "../../components/Skeletons";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export function AccountsPage() {
    const { accounts, accountTypes, users, isLoading, refreshAccounts, handleDelete } = useAppDataContext();
    const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
    const { selectedUser, isFilterLoading } = useAppFiltersContext();
    const feedback = { setError, setMessage, setIsSaving };

    const isViewLoading = isLoading || isFilterLoading;

    const { accountForm, setAccountForm, handleAccountSubmit } = useAccountForm({
        refreshAccounts,
        ...feedback,
    });

    const accountTypeOptions = useMemo(
        () => (accountTypes.length ? accountTypes : fallbackAccountTypes),
        [accountTypes],
    );

    const userNameById = useMemo(
        () => new Map(users.map((u) => [String(u.id), u.name])),
        [users],
    );

    const availableAccounts = useMemo(() => {
        return accounts.filter((account) => {
            if (!selectedUser) return true;
            const owner =
                users.find((u) => String(u.id) === String(account.user))?.name || "";
            return !account.user || owner === selectedUser;
        });
    }, [accounts, selectedUser, users]);

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700}>
                    Manage Accounts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your accounts and their balances
                </Typography>
            </Stack>

            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                {isViewLoading ? (
                    <SectionSkeleton lines={6} />
                ) : (
                    <Stack spacing={3}>
                        <Box component="form" onSubmit={handleAccountSubmit} sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                            <TextField
                                label="Name"
                                value={accountForm.name}
                                onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })}
                                required
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Account Type</InputLabel>
                                <Select
                                    label="Account Type"
                                    value={Number(accountForm.type)}
                                    onChange={(event) => setAccountForm({ ...accountForm, type: Number(event.target.value) })}
                                >
                                    {accountTypeOptions.map((accountType) => (
                                        <MenuItem key={accountType.id} value={Number(accountType.id)}>
                                            {accountType.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Balance"
                                type="number"
                                inputProps={{ step: "0.01" }}
                                value={accountForm.balance}
                                onChange={(event) => setAccountForm({ ...accountForm, balance: event.target.value })}
                                required
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={Number(accountForm.is_active)}
                                    onChange={(event) => setAccountForm({ ...accountForm, is_active: Number(event.target.value) })}
                                >
                                    <MenuItem value={1}>Active</MenuItem>
                                    <MenuItem value={0}>Inactive</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth sx={{ gridColumn: { md: "1 / -1" } }}>
                                <InputLabel>User</InputLabel>
                                <Select
                                    label="User"
                                    value={String(accountForm.user)}
                                    onChange={(event) => setAccountForm({ ...accountForm, user: event.target.value })}
                                >
                                    <MenuItem value="">Unassigned</MenuItem>
                                    {users.map((user) => (
                                        <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Stack direction="row" spacing={1.5} sx={{ gridColumn: { md: "1 / -1" } }}>
                                <Button type="submit" variant="contained" disabled={isSaving}>
                                    {accountForm.id ? "Update Account" : "Add Account"}
                                </Button>
                                {accountForm.id ? (
                                    <Button variant="outlined" onClick={() => setAccountForm(emptyAccount)}>Cancel Edit</Button>
                                ) : null}
                            </Stack>
                        </Box>

                        <Divider />

                        <Stack spacing={1.25}>
                            {availableAccounts.map((account) => (
                                <Paper key={account.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
                                        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                            <Typography fontWeight={600}>{account.name}</Typography>
                                            <Chip
                                                size="small"
                                                label={accountTypeOptions.find((accountType) => Number(accountType.id) === Number(account.type))?.name || account.type}
                                                variant="outlined"
                                            />
                                            <Chip size="small" label={`PHP ${Number(account.balance || 0).toFixed(2)}`} color="secondary" variant="outlined" />
                                            <Chip size="small" label={Number(account.is_active) === 1 ? "Active" : "Inactive"} variant="filled" color={Number(account.is_active) === 1 ? "info" : "error"} />
                                            <Chip size="small" label={userNameById.get(String(account.user)) || "Unassigned"} variant="filled" color={account.user === 1 ? "warning" : "primary"} />
                                        </Stack>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton aria-label="edit" size="small" onClick={() => setAccountForm({ ...account, user: account.user === "" ? "" : String(account.user) })}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton aria-label="delete" size="small" color="error" onClick={() => handleDelete("deleteAccount", account.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Stack>
                )}
            </Paper>
        </Stack>
    );
}
