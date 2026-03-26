import { useState } from "react";
import { postData } from "../api/googleSheets";
import { emptyCategory } from "../constants/defaults";
import { slugify } from "../lib/format";

/**
 * Manages the category form: state and submit handler.
 * Calls refreshCategories after a successful save so the list stays in sync.
 */
export function useCategoryForm({ refreshCategories, setError, setMessage, setIsSaving }) {
    const [categoryForm, setCategoryForm] = useState(emptyCategory);

    async function handleCategorySubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setError("");
        setMessage("");

        const payload = {
            ...categoryForm,
            id: categoryForm.id || `cat-${slugify(categoryForm.name)}-${Date.now()}`
        };

        try {
            await postData(categoryForm.id ? "updateCategory" : "addCategory", payload);
            await refreshCategories();
            setCategoryForm(emptyCategory);
            setMessage(`Category "${payload.name}" saved.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    }

    return { categoryForm, setCategoryForm, handleCategorySubmit };
}
