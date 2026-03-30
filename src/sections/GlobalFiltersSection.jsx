import { Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { getCurrentMonthInAppTimeZone } from "../lib/format";

export function GlobalFiltersSection({
    selectedUser,
    setSelectedUser,
    users,
    dateFilter,
    setDateFilter,
    updateDateFilter,
    toPickerValue,
    availableYears
}) {
    return (
        <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <FilterListRoundedIcon color="secondary" />
                <Typography variant="h6">Global Filters</Typography>
            </Stack>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "1.1fr 1fr 1fr 1fr auto" } }}>
                <FormControl>
                    <InputLabel>Spendee/Depositor</InputLabel>
                    <Select label="Spendee/Depositor" value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {users.map((user) => (
                            <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Filter type</InputLabel>
                    <Select
                        label="Filter type"
                        value={dateFilter.mode}
                        onChange={(event) => setDateFilter((current) => ({ ...current, mode: event.target.value }))}
                    >
                        <MenuItem value="all">All dates</MenuItem>
                        <MenuItem value="month">By month</MenuItem>
                        <MenuItem value="year">By year</MenuItem>
                        <MenuItem value="range">Date range</MenuItem>
                    </Select>
                </FormControl>

                {dateFilter.mode === "month" ? (
                    <DatePicker
                        label="Month"
                        views={["year", "month"]}
                        value={toPickerValue(dateFilter.month ? `${dateFilter.month}-01` : "")}
                        onChange={(value) => updateDateFilter("month", value ? value.format("YYYY-MM") : "")}
                        slotProps={{ textField: { fullWidth: true } }}
                    />
                ) : null}

                {dateFilter.mode === "year" ? (
                    <DatePicker
                        label="Year"
                        views={["year"]}
                        value={toPickerValue(dateFilter.year ? `${dateFilter.year}-01-01` : "")}
                        onChange={(value) => updateDateFilter("year", value ? value.format("YYYY") : "")}
                        slotProps={{
                            textField: { fullWidth: true, select: false }
                        }}
                    />
                ) : null}

                {dateFilter.mode === "range" ? (
                    <>
                        <DatePicker
                            label="Start date"
                            value={toPickerValue(dateFilter.startDate)}
                            onChange={(value) => updateDateFilter("startDate", value ? value.format("YYYY-MM-DD") : "")}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                        <DatePicker
                            label="End date"
                            value={toPickerValue(dateFilter.endDate)}
                            onChange={(value) => updateDateFilter("endDate", value ? value.format("YYYY-MM-DD") : "")}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </>
                ) : null}

                {dateFilter.mode === "year" ? (
                    <FormControl fullWidth>
                        <InputLabel>Quick year</InputLabel>
                        <Select label="Quick year" value={dateFilter.year} onChange={(event) => updateDateFilter("year", event.target.value)}>
                            <MenuItem value="">Select year</MenuItem>
                            {availableYears.map((year) => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : null}

                <Button
                    variant="outlined"
                    onClick={() => {
                        setSelectedUser("");
                        setDateFilter({ mode: "month", month: getCurrentMonthInAppTimeZone(), year: "", startDate: "", endDate: "" })
                    }}
                >
                    Clear Filter
                </Button>
            </Box>
        </Paper>
    );
}
