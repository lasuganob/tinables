import { useState, Suspense, lazy } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import { DialogTitleWithClose } from "../components/DialogTitleWithClose";

const LineChart = lazy(() =>
  import("../components/LineChart").then((module) => ({ default: module.LineChart }))
);
const PieChart = lazy(() =>
  import("../components/PieChart").then((module) => ({ default: module.PieChart }))
);

export function ChartsSection({
  isViewLoading,
  defaultLineChartData,
  lineChartData,
  pieData,
  chartCategoryId,
  setChartCategoryId,
  chartTagIds,
  setChartTagIds,
  chartCategoryOptions,
  isUtilitiesChart,
  utilitySeriesTags,
}) {
  const [activeModal, setActiveModal] = useState("");

  function ChartSkeleton() {
    return <Skeleton variant="rounded" height={280} />;
  }

  return (
    <>
      {/* ── Inline charts side by side ─────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        {/* Cashflow Timeline card */}
        <Paper
          elevation={0}
          sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <InsightsRoundedIcon color="secondary" sx={{ fontSize: "1.1rem" }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Cashflow Timeline
              </Typography>
            </Stack>
            <Tooltip title="Expand chart">
              <IconButton
                size="small"
                onClick={() => setActiveModal("timeline")}
                aria-label="Expand cashflow timeline"
              >
                <OpenInFullRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {isViewLoading ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <LineChart chartData={defaultLineChartData} />
            </Suspense>
          )}
        </Paper>

        {/* Expense Breakdown card */}
        <Paper
          elevation={0}
          sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <DonutLargeRoundedIcon color="secondary" sx={{ fontSize: "1.1rem" }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Expense Breakdown
              </Typography>
            </Stack>
            <Tooltip title="Expand chart">
              <IconButton
                size="small"
                onClick={() => setActiveModal("breakdown")}
                aria-label="Expand expense breakdown"
              >
                <OpenInFullRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {isViewLoading ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <PieChart data={pieData} />
            </Suspense>
          )}
        </Paper>
      </Box>

      {/* ── Cashflow Timeline modal (with category/tag selectors) ── */}
      <Dialog
        open={activeModal === "timeline"}
        onClose={() => setActiveModal("")}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitleWithClose onClose={() => setActiveModal("")}>
          Cashflow Timeline
        </DialogTitleWithClose>
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
                    : { xs: "1fr", md: "minmax(220px, 280px)" },
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
                      renderValue={(selected) =>
                        selected.length ? (
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {selected.map((value) => (
                              <Chip
                                key={value}
                                size="small"
                                label={
                                  utilitySeriesTags.find(
                                    (tag) => String(tag.id) === String(value)
                                  )?.name || String(value)
                                }
                              />
                            ))}
                          </Box>
                        ) : (
                          "Default series"
                        )
                      }
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

      {/* ── Expense Breakdown modal ──────────────────────────── */}
      <Dialog
        open={activeModal === "breakdown"}
        onClose={() => setActiveModal("")}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitleWithClose onClose={() => setActiveModal("")}>
          Expense Breakdown
        </DialogTitleWithClose>
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
