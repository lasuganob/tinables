import { Box, Paper, Stack, Typography } from "@mui/material";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";

const UPCOMING_FEATURES = [
  {
    icon: <TrackChangesRoundedIcon sx={{ fontSize: 32, color: "#0f766e" }} />,
    title: "Monthly Category Budgets",
    description:
      "Set spending limits per category and get notified as you approach them.",
  },
  {
    icon: <SavingsRoundedIcon sx={{ fontSize: 32, color: "#0f766e" }} />,
    title: "Savings Goals",
    description:
      "Define savings targets and track your progress toward each goal over time.",
  },
  {
    icon: <AutoGraphRoundedIcon sx={{ fontSize: 32, color: "#0f766e" }} />,
    title: "Variance from Actuals",
    description:
      "See progress bars comparing budgeted amounts against what you actually spent.",
  },
];

export function BudgetsPage() {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700}>
          Budgets &amp; Goals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Plan your spending and track progress toward your financial goals.
        </Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: { xs: 4, md: 6 },
          textAlign: "center",
          background:
            "linear-gradient(135deg, rgba(15,118,110,0.04) 0%, rgba(29,78,216,0.04) 100%)",
        }}
      >
        <SavingsRoundedIcon
          sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
        />
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={380} mx="auto">
          Budget tracking is on the roadmap. You&apos;ll be able to set category
          budgets, define savings goals, and see variance from your actual
          spending — all in one place.
        </Typography>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
        }}
      >
        {UPCOMING_FEATURES.map((feature) => (
          <Paper
            key={feature.title}
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 3 }}
          >
            <Stack spacing={1.5}>
              {feature.icon}
              <Typography variant="subtitle1" fontWeight={700}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}
