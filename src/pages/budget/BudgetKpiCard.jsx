import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

export function BudgetKpiCard({ label, value, tone = "neutral" }) {
  const toneColor = {
    neutral: "secondary.main",
    positive: "success.main",
    negative: "error.main",
    warning: "warning.main",
  };

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack spacing={0.75}>
          <Chip
            label={label}
            size="small"
            sx={{
              alignSelf: "flex-start",
              bgcolor: toneColor[tone],
              color: "white",
              fontWeight: 700,
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              height: { xs: 24, sm: 26 },
              "& .MuiChip-label": { px: { xs: 1, sm: 1.25 } },
            }}
          />
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: "1.3rem", sm: "1.85rem" }, lineHeight: 1.15 }}
          >
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
