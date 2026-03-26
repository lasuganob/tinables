import { useEffect, useState } from "react";
import { fetchData, loadBootstrapData, postData } from "../api/googleSheets";
import { normaliseTransaction } from "../utils/transactions";

/**
 * Loads all bootstrap data on mount and whenever selectedUser changes.
 * Also provides helpers to refresh individual collections and a shared delete handler.
 */
export function useAppData({ selectedUser, setError, setMessage, setIsSaving }) {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function bootstrap() {
            try {
                setIsLoading(true);
                setError("");
                const data = await loadBootstrapData(selectedUser);
                setTransactions(data.transactions.map(normaliseTransaction));
                setCategories(data.categories);
                setTags(data.tags);
                setUsers(data.users);
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
        setCategories(await fetchData("getCategories"));
    }

    async function refreshTags() {
        setTags(await fetchData("getTags"));
    }

    async function handleDelete(action, id) {
        setIsSaving(true);
        setError("");
        setMessage("");

        try {
            await postData(action, { id });
            const [nextTransactions, nextCategories, nextTags] = await Promise.all([
                fetchData("getTransactions", selectedUser ? { user: selectedUser } : {}),
                fetchData("getCategories"),
                fetchData("getTags")
            ]);
            setTransactions(nextTransactions.map(normaliseTransaction));
            setCategories(nextCategories);
            setTags(nextTags);
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
        isLoading,
        refreshTransactions,
        refreshCategories,
        refreshTags,
        handleDelete
    };
}
