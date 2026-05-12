import { Autocomplete, TextField } from "@mui/material";

/**
 * Shared category selector dropdown using MUI Autocomplete.
 * Allows searching through categories.
 * Accepts a flat list of category objects { id, name }.
 */
export function CategorySelector({
    value,
    onChange,
    categories = [],
    label = "Category",
    required = false,
    disabled = false,
    size = "small",
    placeholder = "Select a category",
    fullWidth = true,
}) {
    // Find the category object that matches the current value (id)
    const selectedCategory = (categories || []).find((c) => String(c.id) === String(value)) || null;

    return (
        <Autocomplete
            fullWidth={fullWidth}
            size={size}
            disabled={disabled}
            options={categories || []}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, val) => String(option.id) === String(val.id)}
            value={selectedCategory}
            onChange={(_, newValue) => {
                // Ensure we pass the ID back to the parent component
                onChange(newValue ? newValue.id : "");
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    placeholder={placeholder}
                />
            )}
        />
    );
}
