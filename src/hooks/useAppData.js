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

    async function handleDelete(action, id) {
        setIsSaving(true);
        setError("");
        setMessage("");

        try {
            await postData(action, { id });
            const [nextTransactions, nextCategories, nextTags, nextAccounts] = await Promise.all([
                fetchData("getTransactions", selectedUser ? { user: selectedUser } : {}),
                fetchData("getCategories"),
                fetchData("getTags"),
                fetchData("getAccounts")
            ]);
            setTransactions(nextTransactions.map(normaliseTransaction));
            setCategories(nextCategories.map(normaliseCategory));
            setTags(nextTags.map(normaliseTag));
            setAccounts(nextAccounts.map(normaliseAccount));
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
        handleDelete
    };
}
