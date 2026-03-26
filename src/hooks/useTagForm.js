import { useState } from "react";
import { postData } from "../api/googleSheets";
import { emptyTag } from "../constants/defaults";
import { slugify } from "../lib/format";

/**
 * Manages the tag form: state and submit handler.
 * Calls refreshTags after a successful save so the list stays in sync.
 */
export function useTagForm({ refreshTags, setError, setMessage, setIsSaving }) {
    const [tagForm, setTagForm] = useState(emptyTag);

    async function handleTagSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setError("");
        setMessage("");

        const payload = {
            ...tagForm,
            id: tagForm.id || `tag-${slugify(tagForm.name)}-${Date.now()}`
        };

        try {
            await postData(tagForm.id ? "updateTag" : "addTag", payload);
            await refreshTags();
            setTagForm(emptyTag);
            setMessage(`Tag "${payload.name}" saved.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    }

    return { tagForm, setTagForm, handleTagSubmit };
}
