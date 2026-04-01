import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export function ConfirmDeleteDialog({
    open,
    title,
    message,
    confirmLabel = "Delete",
    isSaving = false,
    onCancel,
    onConfirm
}) {
    return (
        <Dialog open={open} onClose={isSaving ? undefined : onCancel} fullWidth maxWidth="xs">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained" disabled={isSaving}>
                    {isSaving ? "Deleting..." : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
