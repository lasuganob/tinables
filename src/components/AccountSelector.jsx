import { useMemo } from "react";
import {
    Chip,
    FormControl,
    InputLabel,
    ListSubheader,
    MenuItem,
    Select
} from "@mui/material";
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

export function AccountSelector({
    label,
    value,
    onChange,
    accounts,
    accountTypes,
    users = [],
    disabled = false,
    required = false,
    includeEmptyOption = true,
    emptyLabel = "Select an account",
    excludeAccountIds = [],
    includeSelectedIds = [],
    accountNameById,
    formatCurrency,
    size = "small"
}) {
    const userNameById = useMemo(
        () => new Map(users.map((user) => [String(user.id), user.name])),
        [users]
    );

    const accountOptionsWithUser = useMemo(() => {
        const accountOptions = [...accounts];

        includeSelectedIds
            .map(String)
            .filter(Boolean)
            .forEach((selectedId) => {
                const exists = accountOptions.some((account) => String(account.id) === selectedId);
                if (!exists) {
                    accountOptions.push({
                        id: selectedId,
                        name: accountNameById?.get(selectedId) || `Account ${selectedId}`
                    });
                }
            });

        return accountOptions.map((account) => ({
            ...account,
            userName: userNameById.get(String(account.user)) || ""
        }));
    }, [accountNameById, accounts, includeSelectedIds, userNameById]);

    const groupedAccountOptions = useMemo(() => {
        const typeNameById = new Map(
            (accountTypes || []).map((accountType) => [String(accountType.id), accountType.name])
        );
        const groups = new Map();
        const excludedIds = new Set(excludeAccountIds.map(String));

        accountOptionsWithUser.forEach((account) => {
            if (excludedIds.has(String(account.id))) {
                return;
            }

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
    }, [accountOptionsWithUser, accountTypes, excludeAccountIds]);

    return (
        <FormControl fullWidth size={size} disabled={disabled} required={required}>
            <InputLabel required={required}>{label}</InputLabel>
            <Select
                label={label}
                value={String(value ?? "")}
                onChange={(event) => onChange(event.target.value)}
                required={required}
            >
                {includeEmptyOption ? <MenuItem value="">{emptyLabel}</MenuItem> : null}
                {groupedAccountOptions.map((group) => ([
                    <ListSubheader
                        key={`${label}-header-${group.typeKey}`}
                        sx={{
                            textTransform: "capitalize",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            fontWeight: "bold"
                        }}
                    >
                        <AccountTypeIcon typeName={group.typeName} />
                        {group.typeName}
                    </ListSubheader>,
                    ...group.accounts.map((account) => (
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
                            {formatCurrency && account.balance ? (
                                <Chip
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    label={formatCurrency(account.balance)}
                                    sx={{ ml: 1 }}
                                />
                            ) : null}
                        </MenuItem>
                    ))
                ]))}
            </Select>
        </FormControl>
    );
}
