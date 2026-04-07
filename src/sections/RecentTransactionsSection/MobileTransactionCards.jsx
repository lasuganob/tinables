import { IconButton, Paper, Stack, Typography } from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { TagBadges } from "./TagBadges";

export function MobileTransactionCards({
    items,
    formatDate,
    formatCurrency,
    categoryNameById,
    accountNameById,
    tagNameById,
    onMenuOpen,
}) {
    if (!items.length) {
        return (
            <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">No transactions found.</Typography>
            </Paper>
        );
    }

    return (
        <Stack spacing={1.25}>
            {items.map((transaction) => (
                <Paper key={transaction.id} elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 1.5 }}>
                    <Stack spacing={1.25}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(transaction.date)}
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {transaction.type === "transfer"
                                        ? `Transfer: ${accountNameById.get(String(transaction.account_id)) || "Unknown"} -> ${accountNameById.get(String(transaction.transfer_account_id)) || "Unknown"}`
                                        : categoryNameById.get(String(transaction.category_id)) || "Unknown"}
                                </Typography>
                                {transaction.type === "transfer" && Number(transaction.transfer_fee || 0) > 0 ? (
                                    <Typography variant="caption" color="text.secondary">
                                        Fee: {formatCurrency(transaction.transfer_fee)}
                                    </Typography>
                                ) : null}
                            </Stack>
                            <IconButton
                                size="small"
                                onClick={(event) => onMenuOpen(event, transaction)}
                                aria-label="Open transaction actions"
                                sx={{ mt: -0.5, mr: -0.5 }}
                            >
                                <MoreVertRoundedIcon fontSize="small" />
                            </IconButton>
                        </Stack>

                        {transaction.tags?.length ? (
                            <TagBadges tagValues={transaction.tags} tagNameById={tagNameById} />
                        ) : null}

                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="body2" color="text.secondary">
                                {accountNameById.get(String(transaction.account_id)) || "-"}
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={800}>
                                {formatCurrency(transaction.amount)}
                            </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                                {transaction.user || "All"}
                            </Typography>
                            {transaction.note ? (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textAlign: "right", maxWidth: "60%" }}
                                >
                                    {transaction.note}
                                </Typography>
                            ) : null}
                        </Stack>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
}
