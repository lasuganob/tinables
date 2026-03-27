import { useState } from "react";
import {
    Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, FormControl,
    InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography
} from "@mui/material";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import { SectionSkeleton } from "../components/Skeletons";

export function ManagersSection({
    isViewLoading,
    handleCategorySubmit,
    categoryForm,
    setCategoryForm,
    emptyCategory,
    isSaving,
    categories,
    handleDelete,
    handleTagSubmit,
    tagForm,
    setTagForm,
    emptyTag,
    tags
}) {
    const [activeManager, setActiveManager] = useState("");

    return (
        <>
            <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CategoryRoundedIcon color="secondary" />
                        <Typography variant="h6">Managers</Typography>
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Button variant="contained" onClick={() => setActiveManager("categories")}>Manage Categories</Button>
                        <Button variant="outlined" onClick={() => setActiveManager("tags")} startIcon={<SellRoundedIcon />}>Manage Tags</Button>
                    </Stack>
                </Stack>
            </Paper>

            <Dialog open={activeManager === "categories"} onClose={() => setActiveManager("")} fullWidth maxWidth="md">
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogContent dividers>
                    {isViewLoading ? (
                        <SectionSkeleton lines={6} />
                    ) : (
                        <Stack spacing={2.5}>
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
                                    <Paper key={category.id} variant="outlined" sx={{ p: 1.5 }}>
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
                </DialogContent>
            </Dialog>

            <Dialog open={activeManager === "tags"} onClose={() => setActiveManager("")} fullWidth maxWidth="md">
                <DialogTitle>Manage Tags</DialogTitle>
                <DialogContent dividers>
                    {isViewLoading ? (
                        <SectionSkeleton lines={6} />
                    ) : (
                        <Stack spacing={2.5}>
                            <Box component="form" onSubmit={handleTagSubmit} sx={{ display: "grid", gap: 2 }}>
                                <TextField
                                    label="Name"
                                    value={tagForm.name}
                                    onChange={(event) => setTagForm({ ...tagForm, name: event.target.value })}
                                    required
                                    fullWidth
                                />
                                <Stack direction="row" spacing={1.5}>
                                    <Button type="submit" variant="contained" disabled={isSaving}>
                                        {tagForm.id ? "Update Tag" : "Add Tag"}
                                    </Button>
                                    {tagForm.id ? (
                                        <Button variant="outlined" onClick={() => setTagForm(emptyTag)}>Cancel Edit</Button>
                                    ) : null}
                                </Stack>
                            </Box>
                            <Divider />
                            <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                                {tags.map((tag) => (
                                    <Paper key={tag.id} variant="outlined" sx={{ p: 1.25, minWidth: 180 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                            <Chip label={tag.name} color="secondary" variant="outlined" />
                                            <Stack direction="row" spacing={0.5}>
                                                <Button variant="text" size="small" onClick={() => setTagForm(tag)}>Edit</Button>
                                                <Button variant="text" size="small" color="error" onClick={() => handleDelete("deleteTag", tag.id)}>Delete</Button>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
