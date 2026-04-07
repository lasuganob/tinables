import { useEffect, useState } from "react";
import { postData } from "../api/googleSheets";
import { emptyTransaction } from "../constants/defaults";
import { getTodayInAppTimeZone } from "../lib/format";
import { isSalaryTransaction } from "../utils/salaryAllocator";

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
    const originalTransferFee = Number(originalTransaction.transfer_fee || 0);
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
            balances.set(originalAccountId, (balances.get(originalAccountId) || 0) + originalAmount + originalTransferFee);
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

function validateActiveAccounts(accounts, transactionForm, previousTransaction) {
    const accountsById = new Map(accounts.map((account) => [String(account.id), account]));
    const fieldsToValidate = ["account_id", "transfer_account_id"];

    for (const fieldName of fieldsToValidate) {
        const nextAccountId = String(transactionForm[fieldName] || "");

        if (!nextAccountId) {
            continue;
        }

        const account = accountsById.get(nextAccountId);

        if (!account) {
            return `Account not found for id ${nextAccountId}.`;
        }

        if (Number(account.is_active) === 1) {
            continue;
        }

        const previousAccountId = previousTransaction
            ? String(previousTransaction[fieldName] || "")
            : "";

        if (previousAccountId === nextAccountId) {
            continue;
        }

        return "Inactive accounts cannot be used for new transactions. Please choose an active account.";
    }

    return "";
}

export function useTransactionForm({
    selectedUser,
    users,
    accounts,
    transactions,
    categories,
    saveTransactionLocally,
    setError,
    setMessage,
    setIsSaving
}) {
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
            transfer_fee: transactionForm.type === "transfer"
                ? Number(transactionForm.transfer_fee || 0)
                : 0,
            account_id: transactionForm.account_id ? String(transactionForm.account_id) : "",
            transfer_account_id: transactionForm.transfer_account_id ? String(transactionForm.transfer_account_id) : "",
            category_id: transactionForm.type === "transfer" ? "" : transactionForm.category_id,
            source_salary_transaction_id: transactionForm.source_salary_transaction_id
                ? String(transactionForm.source_salary_transaction_id)
                : "",
            salary_allocation_item_id: transactionForm.salary_allocation_item_id
                ? String(transactionForm.salary_allocation_item_id)
                : "",
            tags: transactionForm.tags.length <= 1
                ? String(transactionForm.tags[0] || "")
                : transactionForm.tags.join(",")
        };

        if (payload.type === "expense" || payload.type === "transfer") {
            const effectiveBalances = getEffectiveBalances(accounts, transactions, transactionForm);
            const sourceBalance = effectiveBalances.get(String(payload.account_id)) || 0;

            const requiredBalance = payload.type === "transfer"
                ? payload.amount + payload.transfer_fee
                : payload.amount;

            if (sourceBalance < requiredBalance) {
                setError("Insufficient account balance for this transaction.");
                setIsSaving(false);
                return { ok: false };
            }
        }

        try {
            const previousTransaction = transactionForm.id
                ? transactions.find((transaction) => String(transaction.id) === String(transactionForm.id)) || null
                : null;
            const inactiveAccountError = validateActiveAccounts(accounts, payload, previousTransaction);

            if (inactiveAccountError) {
                setError(inactiveAccountError);
                return { ok: false };
            }

            const result = await postData(transactionForm.id ? "updateTransaction" : "addTransaction", payload);
            const savedTransaction = saveTransactionLocally(
                { ...payload, id: result.id ?? payload.id },
                previousTransaction
            );
            resetTransactionForm();
            setMessage(`Transaction ${result.id ?? payload.id} saved.`);
            return {
                ok: true,
                transactionId: String(result.id ?? payload.id),
                isSalaryTransaction: isSalaryTransaction(savedTransaction, categories),
                salaryAmount: Number(savedTransaction.amount || 0),
                salaryUser: String(savedTransaction.user || ""),
                upcomingPaymentId: String(transactionForm.upcomingPaymentId || "")
            };
        } catch (err) {
            setError(err.message);
            return { ok: false };
        } finally {
            setIsSaving(false);
        }
    }

    return { transactionForm, setTransactionForm, handleTransactionSubmit, resetTransactionForm };
}
