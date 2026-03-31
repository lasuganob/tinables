import { Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useAppDataContext } from "../../context/AppDataContext";
import { useAppFeedbackContext } from "../../context/AppDataContext";
import { useAppFiltersContext } from "../../context/AppFiltersContext";
import { useTagForm } from "../../hooks/useTagForm";
import { emptyTag } from "../../constants/defaults";
import { SectionSkeleton } from "../../components/Skeletons";

export function TagsPage() {
    const { tags, isLoading, refreshTags, handleDelete } = useAppDataContext();
    const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
    const { isFilterLoading } = useAppFiltersContext();
    const feedback = { setError, setMessage, setIsSaving };

    const isViewLoading = isLoading || isFilterLoading;

    const { tagForm, setTagForm, handleTagSubmit } = useTagForm({
        refreshTags,
        ...feedback,
    });

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={700}>
                    Manage Tags
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Organize your transactions with custom tags
                </Typography>
            </Stack>

            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                {isViewLoading ? (
                    <SectionSkeleton lines={6} />
                ) : (
                    <Stack spacing={3}>
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
                                <Paper key={tag.id} variant="outlined" sx={{ p: 1.25, minWidth: 180, borderRadius: 2 }}>
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
            </Paper>
        </Stack>
    );
}
