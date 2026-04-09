import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded';
import { ConfirmDeleteDialog } from "../../components/ConfirmDeleteDialog";
import { useNavigate } from "react-router-dom";

export function TransactionActionMenu({
    anchorEl,
    transaction,
    onClose,
    onEdit,
    onDelete,
    formatCurrency,
    formatDate,
    isSaving,
    pendingDeleteTransaction,
    onCancelDelete,
    onConfirmDelete,
}) {
    const navigate = useNavigate();

    return (
        <>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={onClose}
            >
                <MenuItem
                    onClick={(event) => {
                        event.currentTarget.blur();
                        onClose();
                        onEdit(transaction);
                    }}
                >
                    <ListItemIcon>
                        <EditRoundedIcon fontSize="small" color="secondary" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                {((transaction?.category_id === 1 && transaction?.type === 'income') || transaction?.is_salary_allocation_base === 1) && (
                    <MenuItem
                        onClick={(event) => {
                            event.currentTarget.blur();
                            onClose();
                            navigate(`/salary-allocator/${transaction.id}`);
                        }}
                    >
                        <ListItemIcon>
                            <PieChartRoundedIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText>Allocate</ListItemText>
                    </MenuItem>
                )}
                <MenuItem
                    onClick={(event) => {
                        event.currentTarget.blur();
                        onClose();
                        onDelete(transaction);
                    }}
                >
                    <ListItemIcon>
                        <DeleteRoundedIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            <ConfirmDeleteDialog
                open={Boolean(pendingDeleteTransaction)}
                title="Delete Transaction?"
                message={
                    pendingDeleteTransaction
                        ? `Delete this ${pendingDeleteTransaction.type || "transaction"} entry for ${formatCurrency(pendingDeleteTransaction.amount)} on ${formatDate(pendingDeleteTransaction.date)}?`
                        : ""
                }
                confirmLabel="Delete"
                isSaving={isSaving}
                onCancel={onCancelDelete}
                onConfirm={onConfirmDelete}
            />
        </>
    );
}
