import { useState } from "react";
import { postData } from "../api/googleSheets";
import { emptyAccount } from "../constants/defaults";
import { slugify } from "../lib/format";

/**
 * Manages the account form: state and submit handler.
 * Calls refreshAccounts after a successful save so the list stays in sync.
 */
export function useAccountForm({ refreshAccounts, setError, setMessage, setIsSaving }) {
    const [accountForm, setAccountForm] = useState(emptyAccount);

    async function handleAccountSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setError("");
        setMessage("");

        const payload = {
            ...accountForm,
            id: accountForm.id || `acct-${slugify(accountForm.name)}-${Date.now()}`,
            type: Number(accountForm.type),
            balance: Number(accountForm.balance || 0),
            is_active: Number(accountForm.is_active),
            user: accountForm.user === "" ? "" : Number(accountForm.user)
        };

        try {
            await postData(accountForm.id ? "updateAccount" : "addAccount", payload);
            await refreshAccounts();
            setAccountForm(emptyAccount);
            setMessage(`Account "${payload.name}" saved.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    }

    return { accountForm, setAccountForm, handleAccountSubmit };
}
