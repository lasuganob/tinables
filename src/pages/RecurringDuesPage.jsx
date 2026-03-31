import { Box, Paper, Stack, Typography } from "@mui/material";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";

const UPCOMING_FEATURES = [
  {
    icon: <CalendarMonthRoundedIcon sx={{ fontSize: 32, color: "#0f766e" }} />,
    title: "Recurring Expenses & Income",
    description:
      "Define expenses or income that repeat on a fixed schedule — monthly rent, subscriptions, and more.",
  },
  {
    icon: <NotificationsActiveRoundedIcon sx={{ fontSize: 32, color: "#0f766e" }} />,
    title: "Next Due Date Tracking",
    description:
      "Always know when your next payment is coming so you're never caught off guard.",
  },
  {
    icon: <AddTaskRoundedIcon sx={{ fontSize: 32, color: "#0f766e" }} />,
    title: "Auto-create Draft Transactions",
    description:
      "When a due date arrives, a draft transaction is created automatically for your review.",
  },
];

export function RecurringDuesPage() {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: "1.35rem", sm: "1.7rem" } }}>
          Recurring Dues
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}>
          Manage recurring expenses and income on a predictable schedule.
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
        <RepeatRoundedIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={420} mx="auto">
          Recurring dues support is on the roadmap. You&apos;ll be able to define
          recurring items, track next due dates, and let the app auto-generate
          draft transactions when payment day arrives.
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
