import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { postData } from "../api/googleSheets";
import { DialogTitleWithClose } from "./DialogTitleWithClose";
import { validateAllocationItems } from "../utils/salaryAllocator";

export function EditSalaryAllocationsDialog({
    open,
    onClose,
    allocation,
    allocationItems,
    users,
    onSaved,
    saveSalaryAllocationLocally,
    saveSalaryAllocationItemLocally,
    removeSalaryAllocationItemLocally,
    setError,
    setMessage,
    setIsSaving
}) {
    const [draftAllocation, setDraftAllocation] = useState({ id: "", name: "", user: "" });
    const [draftItems, setDraftItems] = useState([]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setDraftAllocation({
            id: String(allocation?.id || ""),
            name: String(allocation?.name || ""),
            user: String(allocation?.user || users[0]?.name || "")
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
    }, [allocation, allocationItems, open, users]);

    const totalPercentage = useMemo(
        () => draftItems.reduce((sum, item) => sum + Number(item.percentage || 0), 0),
        [draftItems]
    );

    async function handleSave() {
        const validationError = validateAllocationItems(
            draftItems.map((item) => ({ ...item, percentage: Number(item.percentage || 0) }))
        );

        if (!draftAllocation.name.trim()) {
            setError("Allocation name is required.");
            return;
        }

        if (!draftAllocation.user.trim()) {
            setError("Allocation user is required.");
            return;
        }

        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);
        setError("");

        try {
            const allocationPayload = {
                id: draftAllocation.id,
                name: draftAllocation.name.trim(),
                user: draftAllocation.user
            };
            const allocationAction = draftAllocation.id ? "updateSalaryAllocation" : "addSalaryAllocation";
            const allocationResult = await postData(allocationAction, allocationPayload);
            const savedAllocation = saveSalaryAllocationLocally({
                ...allocationPayload,
                id: String(allocationResult.id ?? draftAllocation.id)
            });

            const nextAllocationId = String(savedAllocation.id);
            const existingItemIds = new Set((allocationItems || []).map((item) => String(item.id)));
            const draftItemIds = new Set();

            for (const item of draftItems) {
                const itemPayload = {
                    id: item.id,
                    allocation_id: nextAllocationId,
                    label: item.label.trim(),
                    percentage: Number(item.percentage || 0)
                };
                const itemAction = item.id ? "updateSalaryAllocationItem" : "addSalaryAllocationItem";
                const itemResult = await postData(itemAction, itemPayload);
                const savedItem = saveSalaryAllocationItemLocally({
                    ...itemPayload,
                    id: String(itemResult.id ?? item.id)
                });
                draftItemIds.add(String(savedItem.id));
            }

            for (const existingId of existingItemIds) {
                if (!draftItemIds.has(existingId)) {
                    await postData("deleteSalaryAllocationItem", { id: existingId });
                    removeSalaryAllocationItemLocally(existingId);
                }
            }

            setMessage("Salary allocations saved.");
            onSaved(savedAllocation);
            onClose();
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitleWithClose onClose={onClose}>
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
                    />
                    <FormControl fullWidth size="small">
                        <InputLabel>User</InputLabel>
                        <Select
                            label="User"
                            value={draftAllocation.user}
                            onChange={(event) => setDraftAllocation((current) => ({ ...current, user: event.target.value }))}
                        >
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Stack spacing={1.25}>
                        {draftItems.map((item, index) => (
                            <Box
                                key={item.id || `new-${index}`}
                                sx={{
                                    display: "grid",
                                    gap: 1,
                                    gridTemplateColumns: { xs: "1fr", sm: "1.6fr 1fr auto" },
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
                                />
                                <IconButton
                                    aria-label="Delete allocation item"
                                    color="error"
                                    onClick={() => setDraftItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    <DeleteRoundedIcon />
                                </IconButton>
                            </Box>
                        ))}
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button
                            startIcon={<AddRoundedIcon />}
                            onClick={() => setDraftItems((current) => [...current, { id: "", allocation_id: draftAllocation.id, label: "", percentage: "" }])}
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
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                        bgcolor: "#4a6555",
                        "&:hover": {
                            bgcolor: "#3f594b"
                        }
                    }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
