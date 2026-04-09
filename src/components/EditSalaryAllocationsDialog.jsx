import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    IconButton,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { postData } from "../api/googleSheets";
import { DialogTitleWithClose } from "./DialogTitleWithClose";
import { validateAllocationItems } from "../utils/salaryAllocator";
import { AlertBox } from "./AlertBox";

export function EditSalaryAllocationsDialog({
    open,
    onClose,
    allocation,
    allocationItems,
    onSaved,
    saveSalaryAllocationLocally,
    saveSalaryAllocationItemLocally,
    removeSalaryAllocationItemLocally,
    setMessage,
    setIsSaving,
    isSaving,
}) {
    const [draftAllocation, setDraftAllocation] = useState({ id: "", name: "" });
    const [draftItems, setDraftItems] = useState([]);
    const [validationError, setValidationError] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setDraftAllocation({
            id: String(allocation?.id || ""),
            name: String(allocation?.name || "")
        });
        setDraftItems(
            allocationItems.length
                ? allocationItems.map((item) => ({
                    id: String(item.id || ""),
                    allocation_id: String(item.allocation_id || allocation?.id || ""),
                    label: String(item.label || ""),
                    percentage: String(item.percentage ?? "")
                }))
                : [{ id: "", allocation_id: String(allocation?.id || ""), label: "", percentage: "" }]
        );
    }, [allocation, allocationItems, open]);

    const totalPercentage = useMemo(
        () => draftItems.reduce((sum, item) => sum + Number(item.percentage || 0), 0),
        [draftItems]
    );

    async function handleSave() {
        const validationError = validateAllocationItems(
            draftItems.map((item) => ({ ...item, percentage: Number(item.percentage || 0) }))
        );

        if (!draftAllocation.name.trim()) {
            setValidationError("Allocation name is required.");
            return;
        }

        if (validationError) {
            setValidationError(validationError);
            return;
        }

        setIsSaving(true);
        setValidationError("");

        try {
            const allocationPayload = {
                id: draftAllocation.id,
                name: draftAllocation.name.trim()
            };
            const allocationAction = draftAllocation.id ? "updateSalaryAllocation" : "addSalaryAllocation";
            const allocationResult = await postData(allocationAction, allocationPayload);
            const savedAllocation = saveSalaryAllocationLocally({
                ...allocationPayload,
                id: String(allocationResult.id ?? draftAllocation.id)
            });

            const nextAllocationId = String(savedAllocation.id);
            const existingItemIds = new Set((allocationItems || []).map((item) => String(item.id)));
            const savedItems = await postData("replaceSalaryAllocationItems", {
                allocation_id: nextAllocationId,
                items: draftItems.map((item) => ({
                    id: item.id,
                    label: item.label.trim(),
                    percentage: Number(item.percentage || 0)
                }))
            });
            const draftItemIds = new Set(
                savedItems.map((item) => {
                    const savedItem = saveSalaryAllocationItemLocally({
                        ...item,
                        id: String(item.id ?? "")
                    });
                    return String(savedItem.id);
                })
            );

            for (const existingId of existingItemIds) {
                if (!draftItemIds.has(existingId)) {
                    removeSalaryAllocationItemLocally(existingId);
                }
            }

            setMessage("Salary allocations saved.");
            onSaved(savedAllocation);
            onClose();
        } catch (error) {
            setValidationError(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitleWithClose onClose={onClose} disabled={isSaving}>
                Edit Allocations
            </DialogTitleWithClose>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <TextField
                        label="Allocation Name"
                        value={draftAllocation.name}
                        onChange={(event) => setDraftAllocation((current) => ({ ...current, name: event.target.value }))}
                        fullWidth
                        size="small"
                        disabled={isSaving}
                    />
                    <Divider />
                    <Stack spacing={1.25}>
                        {draftItems.map((item, index) => (
                            <Box
                                key={item.id || `new-${index}`}
                                sx={{
                                    display: "grid",
                                    gap: 2,
                                    gridTemplateColumns: { xs: "2fr 0.8fr auto" },
                                    alignItems: "center"
                                }}
                            >
                                <TextField
                                    label="Label"
                                    size="small"
                                    value={item.label}
                                    onChange={(event) => {
                                        const nextItems = [...draftItems];
                                        nextItems[index] = { ...nextItems[index], label: event.target.value };
                                        setDraftItems(nextItems);
                                    }}
                                    disabled={isSaving}
                                />
                                <TextField
                                    label="Percentage"
                                    size="small"
                                    type="number"
                                    inputProps={{ min: 0, step: "0.01" }}
                                    value={item.percentage}
                                    onChange={(event) => {
                                        const nextItems = [...draftItems];
                                        nextItems[index] = { ...nextItems[index], percentage: event.target.value };
                                        setDraftItems(nextItems);
                                    }}
                                    disabled={isSaving}
                                />
                                <IconButton
                                    aria-label="Delete allocation item"
                                    color="error"
                                    onClick={() => setDraftItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                    disabled={isSaving}
                                >
                                    <DeleteRoundedIcon />
                                </IconButton>
                            </Box>
                        ))}
                        {validationError &&
                            <AlertBox message={validationError} severity="error" onClose={() => setValidationError(null)} />
                        }
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button
                            startIcon={<AddRoundedIcon />}
                            onClick={() => setDraftItems((current) => [...current, { id: "", allocation_id: draftAllocation.id, label: "", percentage: "" }])}
                            disabled={isSaving}
                        >
                            Add Item
                        </Button>
                        <Typography variant="body2" color={Math.abs(totalPercentage - 100) <= 0.001 ? "success.main" : "text.secondary"}>
                            Total: {Number(totalPercentage).toFixed(2)}%
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                        bgcolor: "#4a6555",
                        "&:hover": {
                            bgcolor: "#3f594b"
                        }
                    }}
                    disabled={isSaving}
                >
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
