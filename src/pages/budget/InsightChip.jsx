import { Chip } from "@mui/material";

export function InsightChip({ tone, label }) {
  const colorMap = { success: "success", warning: "warning", error: "error" };

  return (
    <Chip
      size="small"
      label={label}
      color={colorMap[tone] || "default"}
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: "0.72rem", height: 22 }}
    />
  );
}
