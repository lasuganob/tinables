import { useState, Suspense, lazy } from "react";
import { Button, Dialog, DialogContent, DialogTitle, Paper, Skeleton, Stack, Typography } from "@mui/material";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";

const LineChart = lazy(() => import("../components/LineChart").then((module) => ({ default: module.LineChart })));
const PieChart = lazy(() => import("../components/PieChart").then((module) => ({ default: module.PieChart })));

export function ChartsSection({ isViewLoading, lineData, pieData }) {
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
                        <Suspense fallback={<Skeleton variant="rounded" height={360} />}>
                            <LineChart data={lineData} />
                        </Suspense>
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
