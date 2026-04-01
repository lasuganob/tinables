import { useEffect, useState } from "react";
import { postData } from "../api/googleSheets";
import { emptyTransaction } from "../constants/defaults";
import { getTodayInAppTimeZone } from "../lib/format";

/**
 * Manages the transaction form: state, default user initialisation, and submit handler.
 */
function getEffectiveBalances(accounts, transactions, transactionForm) {
    const balances = new Map(
        accounts.map((account) => [String(account.id), Number(account.balance || 0)])
    );

    if (!transactionForm.id) {
        return balances;
    }

    const originalTransaction = transactions.find(
        (transaction) => String(transaction.id) === String(transactionForm.id)
    );

    if (!originalTransaction) {
        return balances;
    }

    const originalAmount = Number(originalTransaction.amount || 0);
    const originalAccountId = String(originalTransaction.account_id || "");
    const originalTransferAccountId = String(originalTransaction.transfer_account_id || "");

    if (originalTransaction.type === "income" && originalAccountId) {
        balances.set(originalAccountId, (balances.get(originalAccountId) || 0) - originalAmount);
    }

    if (originalTransaction.type === "expense" && originalAccountId) {
        balances.set(originalAccountId, (balances.get(originalAccountId) || 0) + originalAmount);
    }

    if (originalTransaction.type === "transfer") {
        if (originalAccountId) {
            balances.set(originalAccountId, (balances.get(originalAccountId) || 0) + originalAmount);
        }
        if (originalTransferAccountId) {
            balances.set(
                originalTransferAccountId,
                (balances.get(originalTransferAccountId) || 0) - originalAmount
            );
        }
    }

    return balances;
}

export function useTransactionForm({ selectedUser, users, accounts, transactions, saveTransactionLocally, setError, setMessage, setIsSaving }) {
    const [transactionForm, setTransactionForm] = useState(emptyTransaction);

    // Once the user list is available, fill in the form's user field if it is still blank.
    useEffect(() => {
        if (users.length || accounts.length) {
            setTransactionForm((current) => ({
                ...current,
                user: current.user || selectedUser || users[0]?.name || "",
                account_id: current.account_id || String(accounts[0]?.id || ""),
                transfer_account_id: current.transfer_account_id || ""
            }));
        }
    }, [users, accounts, selectedUser]);

    function resetTransactionForm() {
        setTransactionForm({
            ...emptyTransaction,
            date: getTodayInAppTimeZone(),
            user: selectedUser || users[0]?.name || "",
            account_id: String(accounts[0]?.id || "")
        });
    }

    async function handleTransactionSubmit() {
        setIsSaving(true);
        setError("");
        setMessage("");

        const payload = {
            ...transactionForm,
            id: transactionForm.id || "",
            amount: Number(transactionForm.amount),
            account_id: transactionForm.account_id ? String(transactionForm.account_id) : "",
            transfer_account_id: transactionForm.transfer_account_id ? String(transactionForm.transfer_account_id) : "",
            category_id: transactionForm.type === "transfer" ? "" : transactionForm.category_id,
            tags: transactionForm.tags.length <= 1
                ? String(transactionForm.tags[0] || "")
                : transactionForm.tags.join(",")
        };

        if (payload.type === "expense" || payload.type === "transfer") {
            const effectiveBalances = getEffectiveBalances(accounts, transactions, transactionForm);
            const sourceBalance = effectiveBalances.get(String(payload.account_id)) || 0;

            if (sourceBalance < payload.amount) {
                setError("Insufficient account balance for this transaction.");
                setIsSaving(false);
                return false;
            }
        }

        try {
            const previousTransaction = transactionForm.id
                ? transactions.find((transaction) => String(transaction.id) === String(transactionForm.id)) || null
                : null;
            const result = await postData(transactionForm.id ? "updateTransaction" : "addTransaction", payload);
            saveTransactionLocally(
                { ...payload, id: result.id ?? payload.id },
                previousTransaction
            );
            resetTransactionForm();
            setMessage(`Transaction ${result.id ?? payload.id} saved.`);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setIsSaving(false);
        }
    }

    return { transactionForm, setTransactionForm, handleTransactionSubmit, resetTransactionForm };
}
