import { useMemo, useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
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
    TextField,
    Typography
} from "@mui/material";
import { useAppDataContext } from "../../context/AppDataContext";
import { useAppFeedbackContext } from "../../context/AppDataContext";
import { useAppFiltersContext } from "../../context/AppFiltersContext";
import { useAccountForm } from "../../hooks/useAccountForm";
import { emptyAccount, fallbackAccountTypes } from "../../constants/defaults";
import { SectionSkeleton } from "../../components/Skeletons";
import { ConfirmDeleteDialog } from "../../components/ConfirmDeleteDialog";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MoneyIcon from '@mui/icons-material/Money';
import SavingsIcon from '@mui/icons-material/Savings';


export function AccountsPage() {
    const { accounts, accountTypes, users, isLoading, handleDelete, saveAccountLocally } = useAppDataContext();
    const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
    const { selectedUser, isFilterLoading } = useAppFiltersContext();
    const feedback = { setError, setMessage, setIsSaving };

    const isViewLoading = isLoading || isFilterLoading;
    const [pendingDeleteAccount, setPendingDeleteAccount] = useState(null);
    const [expandedTypePanels, setExpandedTypePanels] = useState({ "1": false, "2": false, "3": true, "4": false });

    const { accountForm, setAccountForm, handleAccountSubmit } = useAccountForm({
        saveAccountLocally,
        ...feedback,
    });

    async function confirmDeleteAccount() {
        if (!pendingDeleteAccount) return;
        const deleted = await handleDelete("deleteAccount", pendingDeleteAccount.id);
        if (deleted) {
            setPendingDeleteAccount(null);
        }
    }

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
            const owner = userNameById.get(String(account.user)) || "";
            return !account.user || owner === selectedUser;
        });
    }, [accounts, selectedUser, userNameById]);

    const groupedAccounts = useMemo(() => {
        const typeNameById = new Map(
            accountTypeOptions.map((accountType) => [String(accountType.id), accountType.name])
        );
        const groups = new Map();

        availableAccounts.forEach((account) => {
            const typeKey = String(account.type);
            const typeName = typeNameById.get(typeKey) || `Type ${typeKey}`;

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
    }, [accountTypeOptions, availableAccounts]);

    function isPanelExpanded(typeKey) {
        return expandedTypePanels[typeKey] ?? true;
    }

    function handlePanelToggle(typeKey) {
        return (_, isExpanded) => {
            setExpandedTypePanels((current) => ({
                ...current,
                [typeKey]: isExpanded
            }));
        };
    }

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
                                    {accountForm.id ? "Update Account" : "Add Account"}
                                </Button>
                                {accountForm.id ? (
                                    <Button
                                        variant="outlined"
                                        onClick={() => setAccountForm(emptyAccount)}
                                        sx={{
                                            color: "#4a6555",
                                            borderColor: "rgba(74,101,85,0.35)",
                                            "&:hover": {
                                                borderColor: "#4a6555",
                                                bgcolor: "rgba(74,101,85,0.08)"
                                            }
                                        }}
                                    >
                                        Cancel Edit
                                    </Button>
                                ) : null}
                            </Stack>
                        </Box>

                        <Divider />

                        <Stack spacing={1.25}>
                            {groupedAccounts.map((group) => (
                                <Accordion
                                    key={group.typeKey}
                                    expanded={isPanelExpanded(group.typeKey)}
                                    onChange={handlePanelToggle(group.typeKey)}
                                    disableGutters
                                    elevation={0}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 1,
                                        "&:before": { display: "none" }
                                    }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{ width: "100%", pr: 1 }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {group.typeKey == "1" && <MoneyIcon />}
                                                {group.typeKey == "2" && <AccountBalanceWalletIcon />}
                                                {group.typeKey == "3" && <AccountBalanceIcon />}
                                                {group.typeKey == "4" && <SavingsIcon />}
                                                <Typography fontWeight={700} textTransform="capitalize">
                                                    {group.typeName}
                                                </Typography>
                                            </Stack>
                                            <Chip
                                                size="small"
                                                label={`${group.accounts.length} ${group.accounts.length === 1 ? "account" : "accounts"}`}
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <Stack spacing={1.25}>
                                            {group.accounts.map((account) => (
                                                <Paper key={account.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
                                                        <Stack>
                                                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                                                <Typography fontWeight={600}>{account.name}</Typography>
                                                                <Chip size="small" label={Number(account.is_active) === 1 ? "Active" : "Inactive"} variant="filled" color={Number(account.is_active) === 1 ? "info" : "error"} />
                                                                <Chip size="small" label={userNameById.get(String(account.user)) || "Unassigned"} variant="filled" color={account.user === 1 ? "warning" : "primary"} />
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                                                <Typography variant="h6" color="green" fontWeight={600}>
                                                                    ₱{Number(account.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1}>
                                                            <IconButton aria-label="edit" size="small" onClick={() => {
                                                                setAccountForm({ ...account, user: account.user === "" ? "" : String(account.user) });
                                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                                            }}>
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton aria-label="delete" size="small" color="error" onClick={() => setPendingDeleteAccount(account)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Stack>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    </Stack>
                )}
            </Paper>

            <ConfirmDeleteDialog
                open={Boolean(pendingDeleteAccount)}
                title="Delete account?"
                message={
                    pendingDeleteAccount
                        ? `Delete "${pendingDeleteAccount.name}"? This is only allowed when the account is no longer referenced by transactions and its balance is 0.`
                        : ""
                }
                isSaving={isSaving}
                onCancel={() => setPendingDeleteAccount(null)}
                onConfirm={confirmDeleteAccount}
            />
        </Stack>
    );
}
