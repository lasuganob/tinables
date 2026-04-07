import {
    IconButton, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TableSortLabel, Typography
} from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { TagBadges } from "./TagBadges";

export function TransactionTable({
    items,
    transactionSort,
    onToggleSort,
    formatDate,
    formatCurrency,
    categoryNameById,
    accountNameById,
    tagNameById,
    onMenuOpen,
}) {
    return (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sortDirection={transactionSort.key === "date" ? transactionSort.direction : false}>
                            <TableSortLabel
                                active={transactionSort.key === "date"}
                                direction={transactionSort.key === "date" ? transactionSort.direction : "desc"}
                                onClick={() => onToggleSort("date")}
                            >
                                Date
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={transactionSort.key === "category" ? transactionSort.direction : false}>
                            <TableSortLabel
                                active={transactionSort.key === "category"}
                                direction={transactionSort.key === "category" ? transactionSort.direction : "asc"}
                                onClick={() => onToggleSort("category")}
                            >
                                Category/Tags
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={transactionSort.key === "amount" ? transactionSort.direction : false}>
                            <TableSortLabel
                                active={transactionSort.key === "amount"}
                                direction={transactionSort.key === "amount" ? transactionSort.direction : "asc"}
                                onClick={() => onToggleSort("amount")}
                            >
                                Amount
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Account</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Note</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.length ? (
                        items.map((transaction) => (
                            <TableRow key={transaction.id} hover>
                                <TableCell>{formatDate(transaction.date)}</TableCell>
                                <TableCell>
                                    {transaction.type === "transfer"
                                        ? `Transfer: ${accountNameById.get(String(transaction.account_id)) || "Unknown"} -> ${accountNameById.get(String(transaction.transfer_account_id)) || "Unknown"}`
                                        : categoryNameById.get(String(transaction.category_id)) || "Unknown"}
                                    {transaction.type === "transfer" && Number(transaction.transfer_fee || 0) > 0 ? (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Fee: {formatCurrency(transaction.transfer_fee)}
                                        </Typography>
                                    ) : null}
                                    <TagBadges tagValues={transaction.tags} tagNameById={tagNameById} />
                                </TableCell>
                                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                                <TableCell>{accountNameById.get(String(transaction.account_id)) || "-"}</TableCell>
                                <TableCell>{transaction.user || "All"}</TableCell>
                                <TableCell>{transaction.note || "-"}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        onClick={(event) => onMenuOpen(event, transaction)}
                                        aria-label="Open transaction actions"
                                    >
                                        <MoreVertRoundedIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} align="center">No transactions found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
