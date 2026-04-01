import { useState } from "react";
import { Box, Button, Chip, Divider, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { useAppDataContext } from "../../context/AppDataContext";
import { useAppFeedbackContext } from "../../context/AppDataContext";
import { useAppFiltersContext } from "../../context/AppFiltersContext";
import { useTagForm } from "../../hooks/useTagForm";
import { emptyTag } from "../../constants/defaults";
import { SectionSkeleton } from "../../components/Skeletons";
import { ConfirmDeleteDialog } from "../../components/ConfirmDeleteDialog";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export function TagsPage() {
    const { tags, isLoading, handleDelete, saveTagLocally } = useAppDataContext();
    const { isSaving, setError, setMessage, setIsSaving } = useAppFeedbackContext();
    const { isFilterLoading } = useAppFiltersContext();
    const feedback = { setError, setMessage, setIsSaving };

    const isViewLoading = isLoading || isFilterLoading;
    const [pendingDeleteTag, setPendingDeleteTag] = useState(null);

    const { tagForm, setTagForm, handleTagSubmit } = useTagForm({
        saveTagLocally,
        ...feedback,
    });

    async function confirmDeleteTag() {
        if (!pendingDeleteTag) return;
        const deleted = await handleDelete("deleteTag", pendingDeleteTag.id);
        if (deleted) {
            setPendingDeleteTag(null);
        }
    }

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

            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
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
                                <Paper key={tag.id} variant="outlined" sx={{ p: 1.25, minWidth: 180, borderRadius: 1 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                        <Chip label={tag.name} variant="filled" />
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton aria-label="edit" size="small" onClick={() => {
                                                setTagForm(tag);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton aria-label="delete" size="small" color="error" onClick={() => setPendingDeleteTag(tag)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Stack>
                )}
            </Paper>

            <ConfirmDeleteDialog
                open={Boolean(pendingDeleteTag)}
                title="Delete tag?"
                message={
                    pendingDeleteTag
                        ? `Delete "${pendingDeleteTag.name}"? This is only allowed when no transactions use this tag.`
                        : ""
                }
                isSaving={isSaving}
                onCancel={() => setPendingDeleteTag(null)}
                onConfirm={confirmDeleteTag}
            />
        </Stack>
    );
}
