import { useEffect, useState } from "react";
import { fetchData, loadBootstrapData, postData } from "../api/googleSheets";
import { normaliseTransaction } from "../utils/transactions";

function cleanValue(value) {
    return typeof value === "string" ? value.trim() : value;
}

function normaliseCategory(category) {
    return {
        ...category,
        id: cleanValue(category.id),
        name: cleanValue(category.name),
        type: String(cleanValue(category.type) || "").toLowerCase()
    };
}

function normaliseTag(tag) {
    return {
        ...tag,
        id: cleanValue(tag.id),
        name: cleanValue(tag.name)
    };
}

function normaliseUser(user) {
    return {
        ...user,
        id: cleanValue(user.id),
        name: cleanValue(user.name)
    };
}

function normaliseAccount(account) {
    return {
        ...account,
        id: cleanValue(account.id),
        name: cleanValue(account.name),
        type: Number(cleanValue(account.type) || 0),
        balance: Number(cleanValue(account.balance) || 0),
        is_active: Number(cleanValue(account.is_active) || 0),
        user: cleanValue(account.user)
    };
}

function normaliseAccountType(accountType) {
    return {
        ...accountType,
        id: Number(cleanValue(accountType.id) || 0),
        name: String(cleanValue(accountType.name) || "")
    };
}

function upsertById(items, nextItem) {
    const nextId = String(nextItem.id);
    const index = items.findIndex((item) => String(item.id) === nextId);

    if (index === -1) {
        return [nextItem, ...items];
    }

    return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function removeById(items, id) {
    const targetId = String(id);
    return items.filter((item) => String(item.id) !== targetId);
}

function applyTransactionToAccounts(accounts, transaction, direction) {
    const amount = Number(transaction.amount || 0);
    const multiplier = direction === "reverse" ? -1 : 1;
    const sourceAccountId = String(transaction.account_id || "");
    const transferAccountId = String(transaction.transfer_account_id || "");

    return accounts.map((account) => {
        const accountId = String(account.id);
        let nextBalance = Number(account.balance || 0);

        if (transaction.type === "income" && accountId === sourceAccountId) {
            nextBalance += amount * multiplier;
        } else if (transaction.type === "expense" && accountId === sourceAccountId) {
            nextBalance -= amount * multiplier;
        } else if (transaction.type === "transfer") {
            if (accountId === sourceAccountId) {
                nextBalance -= amount * multiplier;
            }
            if (accountId === transferAccountId) {
                nextBalance += amount * multiplier;
            }
        }

        return nextBalance === Number(account.balance || 0)
            ? account
            : { ...account, balance: nextBalance };
    });
}

/**
 * Loads all bootstrap data on mount and whenever selectedUser changes.
 * Also provides helpers to refresh individual collections and a shared delete handler.
 */
export function useAppData({ selectedUser, setError, setMessage, setIsSaving }) {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [users, setUsers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function bootstrap() {
            try {
                setIsLoading(true);
                setError("");
                const data = await loadBootstrapData(selectedUser);
                setTransactions(data.transactions.map(normaliseTransaction));
                setCategories(data.categories.map(normaliseCategory));
                setTags(data.tags.map(normaliseTag));
                setUsers(data.users.map(normaliseUser));
                setAccounts(data.accounts.map(normaliseAccount));
                setAccountTypes(data.accountTypes.map(normaliseAccountType));
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        bootstrap();
    }, [selectedUser]);

    async function refreshTransactions(userOverride = selectedUser) {
        const items = await fetchData("getTransactions", userOverride ? { user: userOverride } : {});
        setTransactions(items.map(normaliseTransaction));
    }

    async function refreshCategories() {
        setCategories((await fetchData("getCategories")).map(normaliseCategory));
    }

    async function refreshTags() {
        setTags((await fetchData("getTags")).map(normaliseTag));
    }

    async function refreshAccounts() {
        setAccounts((await fetchData("getAccounts")).map(normaliseAccount));
    }

    function saveCategoryLocally(category) {
        const normalised = normaliseCategory(category);
        setCategories((current) => upsertById(current, normalised));
        return normalised;
    }

    function saveTagLocally(tag) {
        const normalised = normaliseTag(tag);
        setTags((current) => upsertById(current, normalised));
        return normalised;
    }

    function saveAccountLocally(account) {
        const normalised = normaliseAccount(account);
        setAccounts((current) => upsertById(current, normalised));
        return normalised;
    }

    function saveTransactionLocally(transaction, previousTransaction = null) {
        const normalised = normaliseTransaction(transaction);

        setTransactions((current) => upsertById(current, normalised));
        setAccounts((current) => {
            let nextAccounts = current;

            if (previousTransaction) {
                nextAccounts = applyTransactionToAccounts(nextAccounts, previousTransaction, "reverse");
            }

            return applyTransactionToAccounts(nextAccounts, normalised, "apply");
        });

        return normalised;
    }

    async function handleDelete(action, id) {
        setIsSaving(true);
        setError("");
        setMessage("");

        try {
            await postData(action, { id });

            if (action === "deleteTransaction") {
                const deletedTransaction = transactions.find((transaction) => String(transaction.id) === String(id));
                if (deletedTransaction) {
                    setTransactions((current) => removeById(current, id));
                    setAccounts((current) => applyTransactionToAccounts(current, deletedTransaction, "reverse"));
                }
            } else if (action === "deleteCategory") {
                setCategories((current) => removeById(current, id));
            } else if (action === "deleteTag") {
                setTags((current) => removeById(current, id));
            } else if (action === "deleteAccount") {
                setAccounts((current) => removeById(current, id));
            }

            setMessage(`${id} deleted.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    }

    return {
        transactions,
        categories,
        tags,
        users,
        accounts,
        accountTypes,
        isLoading,
        refreshTransactions,
        refreshCategories,
        refreshTags,
        refreshAccounts,
        handleDelete,
        saveCategoryLocally,
        saveTagLocally,
        saveAccountLocally,
        saveTransactionLocally
    };
}
