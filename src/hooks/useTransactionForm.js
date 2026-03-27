import { useEffect, useState } from "react";
import { postData } from "../api/googleSheets";
import { emptyTransaction } from "../constants/defaults";

/**
 * Manages the transaction form: state, default user initialisation, and submit handler.
 */
export function useTransactionForm({ selectedUser, users, refreshTransactions, setError, setMessage, setIsSaving }) {
    const [transactionForm, setTransactionForm] = useState(emptyTransaction);

    // Once the user list is available, fill in the form's user field if it is still blank.
    useEffect(() => {
        if (users.length) {
            setTransactionForm((current) => ({
                ...current,
                user: current.user || selectedUser || users[0]?.name || ""
            }));
        }
    }, [users, selectedUser]);

    function resetTransactionForm() {
        setTransactionForm({
            ...emptyTransaction,
            date: new Date().toISOString().slice(0, 10),
            user: selectedUser || users[0]?.name || ""
        });
    }

    async function handleTransactionSubmit(id) {
        setIsSaving(true);
        setError("");
        setMessage("");

        const payload = {
            ...transactionForm,
            id: transactionForm.id ? transactionForm.id : id,
            amount: Number(transactionForm.amount),
            tags: transactionForm.tags.length <= 1
                ? String(transactionForm.tags[0] || "")
                : transactionForm.tags.join(",")
        };

        try {
            await postData(transactionForm.id ? "updateTransaction" : "addTransaction", payload);
            await refreshTransactions();
            resetTransactionForm();
            setMessage(`Transaction ${payload.id} saved.`);
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
