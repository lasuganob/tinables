import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { AccountSelector } from "./AccountSelector";
import { DialogTitleWithClose } from "./DialogTitleWithClose";

export function AllocateAmountDialog({
    open,
    onClose,
    onAllocate,
    allocationDialogItem,
    allocationForm,
    setAllocationForm,
    isSaving,
    sourceTransaction,
    fromAccount,
    fromAccountName,
    selectedAllocateAmount,
    expenseCategories,
    accounts,
    accountTypes,
    users,
    accountNameById,
    tags,
    isTagsMenuOpen,
    setIsTagsMenuOpen,
    formatCurrency
}) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitleWithClose onClose={onClose} disabled={isSaving}>
                {allocationDialogItem ? `Allocate ${allocationDialogItem.label}` : "Allocate"}
            </DialogTitleWithClose>
            <DialogContent>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                    divider={<Divider orientation="vertical" flexItem />}
                >
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.6em", textTransform: "uppercase", letterSpacing: 1 }}>
                            User
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {sourceTransaction?.user}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.6em", textTransform: "uppercase", letterSpacing: 1 }}>
                            Amount to allocate
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {formatCurrency(selectedAllocateAmount)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.6em", textTransform: "uppercase", letterSpacing: 1 }}>
                            Source Account
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {fromAccountName}
                        </Typography>
                    </Box>
                </Stack>
                <Stack spacing={2} sx={{ pt: 0.5 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Transaction Type</InputLabel>
                        <Select
                            label="Transaction Type"
                            value={allocationForm.type}
                            disabled={isSaving}
                            onChange={(event) => setAllocationForm((current) => ({
                                ...current,
                                type: event.target.value,
                                category_id: event.target.value === "expense" ? current.category_id : "",
                                transfer_account_id: event.target.value === "transfer" ? current.transfer_account_id : ""
                            }))}
                        >
                            <MenuItem value="expense">Expense</MenuItem>
                            <MenuItem value="transfer">Transfer</MenuItem>
                        </Select>
                    </FormControl>
                    {allocationForm.type === "expense" ? (
                        <FormControl fullWidth size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                                label="Category"
                                value={String(allocationForm.category_id || "")}
                                disabled={isSaving}
                                onChange={(event) => setAllocationForm((current) => ({
                                    ...current,
                                    category_id: event.target.value
                                }))}
                            >
                                <MenuItem value="">Select a category</MenuItem>
                                {expenseCategories.map((category) => (
                                    <MenuItem key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <AccountSelector
                            label="To Account"
                            value={allocationForm.transfer_account_id}
                            onChange={(value) => setAllocationForm((current) => ({
                                ...current,
                                transfer_account_id: value
                            }))}
                            accounts={accounts}
                            accountTypes={accountTypes}
                            users={users}
                            accountNameById={accountNameById}
                            excludeAccountIds={[fromAccount]}
                            includeSelectedIds={[allocationForm.transfer_account_id]}
                            disabled={isSaving}
                        />
                    )}
                    <FormControl fullWidth size="small" disabled={isSaving}>
                        <InputLabel>Tags</InputLabel>
                        <Select
                            multiple
                            open={isTagsMenuOpen}
                            onOpen={() => setIsTagsMenuOpen(true)}
                            onClose={() => setIsTagsMenuOpen(false)}
                            value={allocationForm.tags}
                            onChange={(event) => setAllocationForm((current) => ({
                                ...current,
                                tags: event.target.value
                            }))}
                            input={<OutlinedInput label="Tags" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                    {selected.map((value) => {
                                        const matchedTag = tags.find((tag) => String(tag.id) === String(value));
                                        return (
                                            <Chip
                                                key={String(value)}
                                                label={matchedTag?.name || String(value)}
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {tags.map((tag) => (
                                <MenuItem key={tag.id} value={String(tag.id)}>
                                    {tag.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Note"
                        size="small"
                        multiline
                        minRows={2}
                        value={allocationForm.note}
                        disabled={isSaving}
                        onChange={(event) => setAllocationForm((current) => ({
                            ...current,
                            note: event.target.value
                        }))}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={onAllocate}
                    disabled={isSaving}
                    sx={{
                        bgcolor: "#4a6555",
                        "&:hover": {
                            bgcolor: "#3f594b"
                        }
                    }}
                >
                    {isSaving ? "Allocating..." : "Allocate"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
