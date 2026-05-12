import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

/**
 * Shared category selector dropdown.
 * Accepts a flat list of category objects { id, name } and renders a MUI Select.
 */
export function CategorySelector({
    value,
    onChange,
    categories,
    label = "Category",
    required = false,
    disabled = false,
    size = "small",
    placeholder = "Select a category",
    fullWidth = true,
}) {
    return (
        <FormControl fullWidth={fullWidth} size={size} disabled={disabled} required={required}>
            <InputLabel required={required}>{label}</InputLabel>
            <Select
                label={label}
                value={String(value ?? "")}
                onChange={(event) => onChange(event.target.value)}
                required={required}
            >
                <MenuItem value="">{placeholder}</MenuItem>
                {(categories || []).map((category) => (
                    <MenuItem key={category.id} value={String(category.id)}>
                        {category.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
