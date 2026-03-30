import { useState, Suspense, lazy } from "react";
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, OutlinedInput, Paper, Select, Skeleton, Stack, Typography } from "@mui/material";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";

const LineChart = lazy(() => import("../components/LineChart").then((module) => ({ default: module.LineChart })));
const PieChart = lazy(() => import("../components/PieChart").then((module) => ({ default: module.PieChart })));

export function ChartsSection({
    isViewLoading,
    lineChartData,
    pieData,
    chartCategoryId,
    setChartCategoryId,
    chartTagIds,
    setChartTagIds,
    chartCategoryOptions,
    isUtilitiesChart,
    utilitySeriesTags
}) {
    const [activeChart, setActiveChart] = useState("");

    return (
        <>
            <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <InsightsRoundedIcon color="secondary" />
                        <Typography variant="h6">Charts</Typography>
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Button variant="contained" onClick={() => setActiveChart("timeline")}>Show Cashflow Timeline</Button>
                        <Button variant="outlined" onClick={() => setActiveChart("breakdown")}>Show Breakdown</Button>
                    </Stack>
                </Stack>
            </Paper>

            <Dialog open={activeChart === "timeline"} onClose={() => setActiveChart("")} fullWidth maxWidth="lg">
                <DialogTitle>Cashflow Timeline</DialogTitle>
                <DialogContent dividers>
                    {isViewLoading ? (
                        <Skeleton variant="rounded" height={360} />
                    ) : (
                        <Stack spacing={2.5}>
                            <Box
                                sx={{
                                    display: "grid",
                                    gap: 2,
                                    gridTemplateColumns: isUtilitiesChart
                                        ? { xs: "1fr", md: "minmax(220px, 280px) minmax(260px, 1fr)" }
                                        : { xs: "1fr", md: "minmax(220px, 280px)" }
                                }}
                            >
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        label="Category"
                                        value={chartCategoryId}
                                        onChange={(event) => setChartCategoryId(event.target.value)}
                                    >
                                        <MenuItem value="">All categories</MenuItem>
                                        {chartCategoryOptions.map((category) => (
                                            <MenuItem key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {isUtilitiesChart ? (
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Tags as Series</InputLabel>
                                        <Select
                                            multiple
                                            label="Tags as Series"
                                            value={chartTagIds}
                                            onChange={(event) => setChartTagIds(event.target.value)}
                                            input={<OutlinedInput label="Tags as Series" />}
                                            renderValue={(selected) => (
                                                selected.length ? (
                                                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                                        {selected.map((value) => (
                                                            <Chip
                                                                key={value}
                                                                size="small"
                                                                label={utilitySeriesTags.find((tag) => String(tag.id) === String(value))?.name || String(value)}
                                                            />
                                                        ))}
                                                    </Box>
                                                ) : "Default series"
                                            )}
                                        >
                                            {utilitySeriesTags.map((tag) => (
                                                <MenuItem key={tag.id} value={String(tag.id)}>
                                                    {tag.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : null}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {isUtilitiesChart && chartTagIds.length
                                    ? "Selected utility tags are used as the chart series."
                                    : chartCategoryId
                                        ? "A single series is shown for the selected category."
                                        : "Default series shows Income and Expense across all categories."}
                            </Typography>
                            <Suspense fallback={<Skeleton variant="rounded" height={360} />}>
                                <LineChart chartData={lineChartData} />
                            </Suspense>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={activeChart === "breakdown"} onClose={() => setActiveChart("")} fullWidth maxWidth="lg">
                <DialogTitle>Expense Breakdown</DialogTitle>
                <DialogContent dividers>
                    {isViewLoading ? (
                        <Skeleton variant="rounded" height={360} />
                    ) : (
                        <Suspense fallback={<Skeleton variant="rounded" height={360} />}>
                            <PieChart data={pieData} />
                        </Suspense>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
