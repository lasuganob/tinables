import { useEffect, useMemo, useState } from "react";
import {
    Button, Paper, Skeleton, Stack, TablePagination, TextField, Typography,
    useMediaQuery, useTheme
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { TableSkeleton } from "../../components/Skeletons";
import { parseDateValue } from "../../lib/format";
import { TransactionEditor } from "./TransactionEditor";
import { TransactionTable } from "./TransactionTable";
import { MobileTransactionCards } from "./MobileTransactionCards";
import { TransactionActionMenu } from "./TransactionActionMenu";

export function RecentTransactionsSection({
    isViewLoading,
    formatDate,
    formatCurrency,
    categoryNameById,
    accountNameById,
    tagNameById,
    transactionForm,
    setTransactionForm,
    isSaving,
    filteredCategories,
    accounts,
    accountTypes,
    users,
    transactionFormTagIds,
    tags,
    handleTransactionSubmit,
    resetTransactionForm,
    handleDelete,
    toPickerValue,
    visibleTransactions,
    allTransactions,
    allCategories,
    transactionEditorTrigger
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [transactionSort, setTransactionSort] = useState({ key: "date", direction: "desc" });
    const [transactionMenuAnchor, setTransactionMenuAnchor] = useState(null);
    const [activeTransaction, setActiveTransaction] = useState(null);
    const [showInlineTransactionEditor, setShowInlineTransactionEditor] = useState(false);
    const [pendingDeleteTransaction, setPendingDeleteTransaction] = useState(null);
    const [transactionSearch, setTransactionSearch] = useState("");
    const [debouncedTransactionSearch, setDebouncedTransactionSearch] = useState("");

    useEffect(() => {
        if (!showInlineTransactionEditor) return;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [showInlineTransactionEditor]);

    useEffect(() => {
        if (!transactionEditorTrigger) return;
        setShowInlineTransactionEditor(true);
    }, [transactionEditorTrigger]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedTransactionSearch(transactionSearch);
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [transactionSearch]);

    useEffect(() => {
        setPage(0);
    }, [debouncedTransactionSearch]);

    const handleChangePage = (event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredTransactions = useMemo(() => {
        const query = debouncedTransactionSearch.trim().toLowerCase();

        if (!query) {
            return visibleTransactions;
        }

        return visibleTransactions.filter((transaction) => {
            const categoryLabel = transaction.type === "transfer"
                ? `Transfer: ${accountNameById.get(String(transaction.account_id)) || "Unknown"} -> ${accountNameById.get(String(transaction.transfer_account_id)) || "Unknown"}`
                : categoryNameById.get(String(transaction.category_id)) || "Unknown";
            const tagLabel = (transaction.tags || [])
                .map((tagValue) => tagNameById.get(String(tagValue)) || String(tagValue))
                .join(" ");
            const noteLabel = String(transaction.note || "");

            return [categoryLabel, tagLabel, noteLabel].some((value) => value.toLowerCase().includes(query));
        });
    }, [visibleTransactions, debouncedTransactionSearch, accountNameById, categoryNameById, tagNameById]);

    const sortedTransactions = useMemo(() => {
        const items = [...filteredTransactions];
        items.sort((left, right) => {
            if (transactionSort.key === "category") {
                const leftName = categoryNameById.get(String(left.category_id)) || "Unknown";
                const rightName = categoryNameById.get(String(right.category_id)) || "Unknown";
                return transactionSort.direction === "asc"
                    ? leftName.localeCompare(rightName)
                    : rightName.localeCompare(leftName);
            }
            if (transactionSort.key === "amount") {
                return transactionSort.direction === "asc"
                    ? Number(left.amount) - Number(right.amount)
                    : Number(right.amount) - Number(left.amount);
            }
            const dateDifference = parseDateValue(left.date) - parseDateValue(right.date);
            if (dateDifference !== 0) {
                return transactionSort.direction === "asc" ? dateDifference : -dateDifference;
            }
            const idDifference = Number(left.id) - Number(right.id);
            return transactionSort.direction === "asc" ? idDifference : -idDifference;
        });
        return items;
    }, [filteredTransactions, transactionSort, categoryNameById]);

    const paginatedTransactions = useMemo(() => {
        const start = page * rowsPerPage;
        return sortedTransactions.slice(start, start + rowsPerPage);
    }, [sortedTransactions, page, rowsPerPage]);

    function toggleTransactionSort(key) {
        setTransactionSort((current) => {
            if (current.key === key) {
                return { key, direction: current.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: key === "category" ? "asc" : "desc" };
        });
    }

    function openTransactionMenu(event, transaction) {
        setTransactionMenuAnchor(event.currentTarget);
        setActiveTransaction(transaction);
    }

    function closeTransactionMenu() {
        setTransactionMenuAnchor(null);
        setActiveTransaction(null);
    }

    async function deleteTransactionRow(id) {
        try {
            await handleDelete("deleteTransaction", id);
            setPendingDeleteTransaction(null);
        } finally {
            // no-op
        }
    }

    async function handleEditorSubmit() {
        const saved = await handleTransactionSubmit();
        if (saved?.ok) {
            setShowInlineTransactionEditor(false);
        }
    }

    function openNewTransactionRow() {
        resetTransactionForm();
        setShowInlineTransactionEditor(true);
    }

    function handleEditorCancel() {
        resetTransactionForm();
        setShowInlineTransactionEditor(false);
    }

    return (
        <>
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                >
                    <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>Transactions</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={openNewTransactionRow}
                        disabled={showInlineTransactionEditor}
                        fullWidth={isMobile}
                        sx={{
                            bgcolor: "#4a6555",
                            "&:hover": { bgcolor: "#3f594b" }
                        }}
                    >
                        Add Entry
                    </Button>
                </Stack>

                {showInlineTransactionEditor ? (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 2,
                            p: { xs: 1.25, sm: 1.5, md: 2 },
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "rgba(15,118,110,0.02)"
                        }}
                    >
                        <Stack spacing={1.25}>
                            <Typography variant="subtitle2" fontWeight={700}>
                                {transactionForm.id ? "Edit transaction" : "New transaction"}
                            </Typography>
                            <TransactionEditor
                                transactionForm={transactionForm}
                                setTransactionForm={setTransactionForm}
                                isSaving={isSaving}
                                filteredCategories={filteredCategories}
                                accounts={accounts}
                                accountTypes={accountTypes}
                                users={users}
                                transactionFormTagIds={transactionFormTagIds}
                                tags={tags}
                                formatDate={formatDate}
                                formatCurrency={formatCurrency}
                                accountNameById={accountNameById}
                                tagNameById={tagNameById}
                                toPickerValue={toPickerValue}
                                allTransactions={allTransactions}
                                allCategories={allCategories}
                                onSubmit={handleEditorSubmit}
                                onCancel={handleEditorCancel}
                            />
                        </Stack>
                    </Paper>
                ) : null}

                <TextField
                    fullWidth
                    size="small"
                    label="Search transactions"
                    placeholder="Filter by category, tag, or note"
                    value={transactionSearch}
                    onChange={(event) => setTransactionSearch(event.target.value)}
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                />

                {isViewLoading ? (
                    isMobile ? (
                        <Stack spacing={1.25}>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Paper key={index} elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2 }}>
                                    <Stack spacing={1}>
                                        <Skeleton width="45%" />
                                        <Skeleton />
                                        <Skeleton width="60%" />
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                        <TableSkeleton rows={rowsPerPage} columns={7} />
                    )
                ) : (
                    <>
                        {isMobile ? (
                            <MobileTransactionCards
                                items={paginatedTransactions}
                                formatDate={formatDate}
                                formatCurrency={formatCurrency}
                                categoryNameById={categoryNameById}
                                accountNameById={accountNameById}
                                tagNameById={tagNameById}
                                onMenuOpen={openTransactionMenu}
                            />
                        ) : (
                            <TransactionTable
                                items={paginatedTransactions}
                                transactionSort={transactionSort}
                                onToggleSort={toggleTransactionSort}
                                formatDate={formatDate}
                                formatCurrency={formatCurrency}
                                categoryNameById={categoryNameById}
                                accountNameById={accountNameById}
                                tagNameById={tagNameById}
                                onMenuOpen={openTransactionMenu}
                            />
                        )}
                        <TablePagination
                            rowsPerPageOptions={isMobile ? [5, 10, 15] : [5, 15, 25, 50]}
                            component="div"
                            count={sortedTransactions.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{
                                mt: 1,
                                ".MuiTablePagination-toolbar": {
                                    px: { xs: 0, sm: 2 },
                                    minHeight: { xs: 52, sm: 56 },
                                    flexWrap: "wrap"
                                },
                                ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" }
                                }
                            }}
                        />
                    </>
                )}
            </Paper>

            <TransactionActionMenu
                anchorEl={transactionMenuAnchor}
                transaction={activeTransaction}
                onClose={closeTransactionMenu}
                onEdit={(t) => {
                    if (t) {
                        setTransactionForm(t);
                        setShowInlineTransactionEditor(true);
                    }
                }}
                onDelete={(t) => {
                    if (t) {
                        setPendingDeleteTransaction(t);
                    }
                }}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                isSaving={isSaving}
                pendingDeleteTransaction={pendingDeleteTransaction}
                onCancelDelete={() => {
                    if (!isSaving) {
                        setPendingDeleteTransaction(null);
                    }
                }}
                onConfirmDelete={() => {
                    if (pendingDeleteTransaction) {
                        void deleteTransactionRow(pendingDeleteTransaction.id);
                    }
                }}
            />
        </>
    );
}
