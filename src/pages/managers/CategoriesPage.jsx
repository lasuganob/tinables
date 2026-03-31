import { Box, Button, Chip, Divider, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from "@mui/material";
import { useAppDataContext } from "../../context/AppDataContext";
import { useAppFeedbackContext } from "../../context/AppDataContext";
import { useAppFiltersContext } from "../../context/AppFiltersContext";
import { useCategoryForm } from "../../hooks/useCategoryForm";
import { emptyCategory } from "../../constants/defaults";
import { SectionSkeleton } from "../../components/Skeletons";

export function CategoriesPage() {
    const { categories, isLoading, refreshCategories, handleDelete } = useAppDataContext();
    const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
    const { isFilterLoading } = useAppFiltersContext();
    const feedback = { setError, setMessage, setIsSaving };

    const isViewLoading = isLoading || isFilterLoading;

    const { categoryForm, setCategoryForm, handleCategorySubmit } =
        useCategoryForm({ refreshCategories, ...feedback });

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700}>
                    Manage Categories
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your categories and their types
                </Typography>
            </Stack>

            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                {isViewLoading ? (
                    <SectionSkeleton lines={6} />
                ) : (
                    <Stack spacing={3}>
                        <Box component="form" onSubmit={handleCategorySubmit} sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                            <TextField
                                label="Name"
                                value={categoryForm.name}
                                onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                                required
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select label="Type" value={categoryForm.type} onChange={(event) => setCategoryForm({ ...categoryForm, type: event.target.value })}>
                                    <MenuItem value="expense">Expense</MenuItem>
                                    <MenuItem value="income">Income</MenuItem>
                                </Select>
                            </FormControl>
                            <Stack direction="row" spacing={1.5} sx={{ gridColumn: { md: "1 / -1" } }}>
                                <Button type="submit" variant="contained" disabled={isSaving}>
                                    {categoryForm.id ? "Update Category" : "Add Category"}
                                </Button>
                                {categoryForm.id ? (
                                    <Button variant="outlined" onClick={() => setCategoryForm(emptyCategory)}>Cancel Edit</Button>
                                ) : null}
                            </Stack>
                        </Box>

                        <Divider />

                        <Stack spacing={1.25}>
                            {categories.map((category) => (
                                <Paper key={category.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography fontWeight={600}>{category.name}</Typography>
                                            <Chip size="small" label={category.type} variant="outlined" />
                                        </Stack>
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" size="small" onClick={() => setCategoryForm(category)}>Edit</Button>
                                            <Button variant="outlined" color="error" size="small" onClick={() => handleDelete("deleteCategory", category.id)}>Delete</Button>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Stack>
                )}
            </Paper>
        </Stack>
    );
}
