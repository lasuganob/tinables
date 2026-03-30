import { useState } from "react";
import {
    Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, FormControl,
    InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography
} from "@mui/material";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import { SectionSkeleton } from "../components/Skeletons";

export function ManagersSection({
    isViewLoading,
    handleCategorySubmit,
    categoryForm,
    setCategoryForm,
    emptyCategory,
    isSaving,
    categories,
    handleDelete,
    handleTagSubmit,
    tagForm,
    setTagForm,
    emptyTag,
    tags,
    handleAccountSubmit,
    accountForm,
    setAccountForm,
    emptyAccount,
    accounts,
    accountTypes,
    users,
    userNameById
}) {
    const [activeManager, setActiveManager] = useState("");

    return (
        <>
            <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CategoryRoundedIcon color="secondary" />
                        <Typography variant="h6">Managers</Typography>
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Button variant="contained" onClick={() => setActiveManager("categories")}>Manage Categories</Button>
                        <Button variant="outlined" onClick={() => setActiveManager("tags")} startIcon={<SellRoundedIcon />}>Manage Tags</Button>
                        <Button variant="outlined" onClick={() => setActiveManager("accounts")} startIcon={<AccountBalanceWalletRoundedIcon />}>Manage Accounts</Button>
                    </Stack>
                </Stack>
            </Paper>

            <Dialog open={activeManager === "categories"} onClose={() => setActiveManager("")} fullWidth maxWidth="md">
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogContent dividers>
                    {isViewLoading ? (
                        <SectionSkeleton lines={6} />
                    ) : (
                        <Stack spacing={2.5}>
                            <Box component="form" onSubmit={handleCategorySubmit} sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                                <TextField
                                    label="Name"
                                    value={categoryForm.name}
                                    onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                                    required
                                    fullWidth
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select label="Type" value={categoryForm.type} onChange={(event) => setCategoryForm({ ...categoryForm, type: event.target.value })}>
                                        <MenuItem value="expense">Expense</MenuItem>
                                        <MenuItem value="income">Income</MenuItem>
                                    </Select>
                                </FormControl>
                                <Stack direction="row" spacing={1.5} sx={{ gridColumn: { md: "1 / -1" } }}>
                                    <Button type="submit" variant="contained" disabled={isSaving}>
                                        {categoryForm.id ? "Update Category" : "Add Category"}
                                    </Button>
                                    {categoryForm.id ? (
                                        <Button variant="outlined" onClick={() => setCategoryForm(emptyCategory)}>Cancel Edit</Button>
                                    ) : null}
                                </Stack>
                            </Box>
                            <Divider />
                            <Stack spacing={1.25}>
                                {categories.map((category) => (
                                    <Paper key={category.id} variant="outlined" sx={{ p: 1.5 }}>
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography fontWeight={600}>{category.name}</Typography>
                                                <Chip size="small" label={category.type} variant="outlined" />
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                <Button variant="outlined" size="small" onClick={() => setCategoryForm(category)}>Edit</Button>
                                                <Button variant="outlined" color="error" size="small" onClick={() => handleDelete("deleteCategory", category.id)}>Delete</Button>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={activeManager === "tags"} onClose={() => setActiveManager("")} fullWidth maxWidth="md">
                <DialogTitle>Manage Tags</DialogTitle>
                <DialogContent dividers>
                    {isViewLoading ? (
                        <SectionSkeleton lines={6} />
                    ) : (
                        <Stack spacing={2.5}>
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
                                    <Paper key={tag.id} variant="outlined" sx={{ p: 1.25, minWidth: 180 }}>
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
                </DialogContent>
            </Dialog>

            <Dialog open={activeManager === "accounts"} onClose={() => setActiveManager("")} fullWidth maxWidth="md">
                <DialogTitle>Manage Accounts</DialogTitle>
                <DialogContent dividers>
                    {isViewLoading ? (
                        <SectionSkeleton lines={6} />
                    ) : (
                        <Stack spacing={2.5}>
                            <Box component="form" onSubmit={handleAccountSubmit} sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                                <TextField
                                    label="Name"
                                    value={accountForm.name}
                                    onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })}
                                    required
                                    fullWidth
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Account Type</InputLabel>
                                    <Select
                                        label="Account Type"
                                        value={Number(accountForm.type)}
                                        onChange={(event) => setAccountForm({ ...accountForm, type: Number(event.target.value) })}
                                    >
                                        {accountTypes.map((accountType) => (
                                            <MenuItem key={accountType.id} value={Number(accountType.id)}>
                                                {accountType.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Balance"
                                    type="number"
                                    inputProps={{ step: "0.01" }}
                                    value={accountForm.balance}
                                    onChange={(event) => setAccountForm({ ...accountForm, balance: event.target.value })}
                                    required
                                    fullWidth
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        label="Status"
                                        value={Number(accountForm.is_active)}
                                        onChange={(event) => setAccountForm({ ...accountForm, is_active: Number(event.target.value) })}
                                    >
                                        <MenuItem value={1}>Active</MenuItem>
                                        <MenuItem value={0}>Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth sx={{ gridColumn: { md: "1 / -1" } }}>
                                    <InputLabel>User</InputLabel>
                                    <Select
                                        label="User"
                                        value={String(accountForm.user)}
                                        onChange={(event) => setAccountForm({ ...accountForm, user: event.target.value })}
                                    >
                                        <MenuItem value="">Unassigned</MenuItem>
                                        {users.map((user) => (
                                            <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Stack direction="row" spacing={1.5} sx={{ gridColumn: { md: "1 / -1" } }}>
                                    <Button type="submit" variant="contained" disabled={isSaving}>
                                        {accountForm.id ? "Update Account" : "Add Account"}
                                    </Button>
                                    {accountForm.id ? (
                                        <Button variant="outlined" onClick={() => setAccountForm(emptyAccount)}>Cancel Edit</Button>
                                    ) : null}
                                </Stack>
                            </Box>
                            <Divider />
                            <Stack spacing={1.25}>
                                {accounts.map((account) => (
                                    <Paper key={account.id} variant="outlined" sx={{ p: 1.5 }}>
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
                                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                                <Typography fontWeight={600}>{account.name}</Typography>
                                                <Chip
                                                    size="small"
                                                    label={accountTypes.find((accountType) => Number(accountType.id) === Number(account.type))?.name || account.type}
                                                    variant="outlined"
                                                />
                                                <Chip size="small" label={`PHP ${Number(account.balance || 0).toFixed(2)}`} color="secondary" variant="outlined" />
                                                <Chip size="small" label={Number(account.is_active) === 1 ? "Active" : "Inactive"} variant="outlined" />
                                                <Chip size="small" label={userNameById.get(String(account.user)) || "Unassigned"} variant="outlined" />
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                <Button variant="outlined" size="small" onClick={() => setAccountForm({ ...account, user: account.user === "" ? "" : String(account.user) })}>Edit</Button>
                                                <Button variant="outlined" color="error" size="small" onClick={() => handleDelete("deleteAccount", account.id)}>Delete</Button>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
