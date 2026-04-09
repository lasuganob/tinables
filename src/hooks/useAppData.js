import { useEffect, useRef, useState } from "react";
import { fetchData, loadBootstrapData, postData } from "../api/googleSheets";
import { normaliseTransaction } from "../utils/transactions";

const APP_RESUME_REFRESH_THRESHOLD_MS = 2 * 60 * 1000;

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

function normaliseSalaryAllocation(allocation) {
    return {
        ...allocation,
        id: cleanValue(allocation.id),
        name: cleanValue(allocation.name)
    };
}

function normaliseSalaryAllocationItem(item) {
    return {
        ...item,
        id: cleanValue(item.id),
        allocation_id: cleanValue(item.allocation_id),
        label: cleanValue(item.label),
        percentage: Number(cleanValue(item.percentage) || 0)
    };
}

function normaliseUpcomingPayment(payment) {
    return {
        ...payment,
        id: cleanValue(payment.id),
        title: cleanValue(payment.title),
        due_date: cleanValue(payment.due_date),
        amount: Number(cleanValue(payment.amount) || 0),
        user: cleanValue(payment.user),
        note: cleanValue(payment.note),
        category_id: cleanValue(payment.category_id),
        status: String(cleanValue(payment.status) || "scheduled").toLowerCase()
    };
}

function normaliseSalaryAllocationHistory(item) {
    return {
        ...item,
        id: cleanValue(item.id),
        source_transaction_id: cleanValue(item.source_transaction_id),
        allocation_id: cleanValue(item.allocation_id),
        allocation_item_id: cleanValue(item.allocation_item_id),
        allocated_transaction_id: cleanValue(item.allocated_transaction_id),
        user: cleanValue(item.user),
        type: cleanValue(item.type),
        amount: Number(cleanValue(item.amount) || 0),
        account_id: cleanValue(item.account_id),
        transfer_account_id: cleanValue(item.transfer_account_id),
        note: cleanValue(item.note),
        allocated_at: cleanValue(item.allocated_at)
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
    const transferFee = Number(transaction.transfer_fee || 0);
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
                nextBalance -= (amount + transferFee) * multiplier;
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
    const [salaryAllocations, setSalaryAllocations] = useState([]);
    const [salaryAllocationItems, setSalaryAllocationItems] = useState([]);
    const [salaryAllocationHistory, setSalaryAllocationHistory] = useState([]);
    const [upcomingPayments, setUpcomingPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const hiddenAtRef = useRef(0);
    const lastResumeRefreshAtRef = useRef(0);

    async function bootstrapData() {
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
            setSalaryAllocations((data.salaryAllocations || []).map(normaliseSalaryAllocation));
            setSalaryAllocationItems((data.salaryAllocationItems || []).map(normaliseSalaryAllocationItem));
            setSalaryAllocationHistory((data.salaryAllocationHistory || []).map(normaliseSalaryAllocationHistory));
            setUpcomingPayments((data.upcomingPayments || []).map(normaliseUpcomingPayment));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        bootstrapData();
    }, [selectedUser]);

    useEffect(() => {
        function shouldRefreshOnResume() {
            const hiddenAt = hiddenAtRef.current;

            if (!hiddenAt) {
                return false;
            }

            const now = Date.now();

            if (now - hiddenAt < APP_RESUME_REFRESH_THRESHOLD_MS) {
                return false;
            }

            if (now - lastResumeRefreshAtRef.current < 1500) {
                return false;
            }

            lastResumeRefreshAtRef.current = now;
            hiddenAtRef.current = 0;
            return true;
        }

        function handleVisibilityChange() {
            if (document.visibilityState === "hidden") {
                hiddenAtRef.current = Date.now();
                return;
            }

            if (document.visibilityState === "visible" && shouldRefreshOnResume()) {
                void bootstrapData();
            }
        }

        function handleFocus() {
            if (shouldRefreshOnResume()) {
                void bootstrapData();
            }
        }

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
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

    async function refreshSalaryAllocations() {
        setSalaryAllocations((await fetchData("getSalaryAllocations")).map(normaliseSalaryAllocation));
    }

    async function refreshSalaryAllocationItems() {
        setSalaryAllocationItems((await fetchData("getSalaryAllocationItems")).map(normaliseSalaryAllocationItem));
    }

    async function refreshUpcomingPayments() {
        setUpcomingPayments((await fetchData("getUpcomingPayments")).map(normaliseUpcomingPayment));
    }

    async function refreshSalaryAllocationHistory() {
        setSalaryAllocationHistory((await fetchData("getSalaryAllocationHistory")).map(normaliseSalaryAllocationHistory));
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

    function saveSalaryAllocationLocally(allocation) {
        const normalised = normaliseSalaryAllocation(allocation);
        setSalaryAllocations((current) => upsertById(current, normalised));
        return normalised;
    }

    function saveSalaryAllocationItemLocally(item) {
        const normalised = normaliseSalaryAllocationItem(item);
        setSalaryAllocationItems((current) => upsertById(current, normalised));
        return normalised;
    }

    function removeSalaryAllocationItemLocally(id) {
        setSalaryAllocationItems((current) => removeById(current, id));
    }

    function saveUpcomingPaymentLocally(payment) {
        const normalised = normaliseUpcomingPayment(payment);
        setUpcomingPayments((current) => upsertById(current, normalised));
        return normalised;
    }

    function saveSalaryAllocationHistoryLocally(item) {
        const normalised = normaliseSalaryAllocationHistory(item);
        setSalaryAllocationHistory((current) => upsertById(current, normalised));
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
                    setSalaryAllocationHistory((current) =>
                        current.filter((item) =>
                            String(item.allocated_transaction_id || "") !== String(id)
                            && String(item.source_transaction_id || "") !== String(id)
                        )
                    );
                }
            } else if (action === "deleteCategory") {
                setCategories((current) => removeById(current, id));
            } else if (action === "deleteTag") {
                setTags((current) => removeById(current, id));
            } else if (action === "deleteAccount") {
                setAccounts((current) => removeById(current, id));
            } else if (action === "deleteSalaryAllocation") {
                setSalaryAllocations((current) => removeById(current, id));
                setSalaryAllocationItems((current) =>
                    current.filter((item) => String(item.allocation_id) !== String(id))
                );
            } else if (action === "deleteSalaryAllocationItem") {
                setSalaryAllocationItems((current) => removeById(current, id));
            } else if (action === "deleteUpcomingPayment") {
                setUpcomingPayments((current) => removeById(current, id));
            }

            setMessage(`${id} deleted.`);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
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
        salaryAllocations,
        salaryAllocationItems,
        salaryAllocationHistory,
        upcomingPayments,
        isLoading,
        refreshTransactions,
        refreshCategories,
        refreshTags,
        refreshAccounts,
        refreshSalaryAllocations,
        refreshSalaryAllocationItems,
        refreshSalaryAllocationHistory,
        refreshUpcomingPayments,
        handleDelete,
        saveCategoryLocally,
        saveTagLocally,
        saveAccountLocally,
        saveTransactionLocally,
        saveSalaryAllocationLocally,
        saveSalaryAllocationItemLocally,
        saveSalaryAllocationHistoryLocally,
        removeSalaryAllocationItemLocally,
        saveUpcomingPaymentLocally
    };
}
