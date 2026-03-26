import { useState } from "react";

/**
 * Shared UI feedback state used across form and data hooks.
 * Keeps error/message/loading in one place so they can be displayed centrally.
 */
export function useFeedback() {
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    return { error, setError, message, setMessage, isSaving, setIsSaving };
}
