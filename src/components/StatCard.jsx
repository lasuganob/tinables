import { Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import HelpIcon from '@mui/icons-material/Help';

export function StatCard({ label, value, tone = "neutral", actionLabel = "", onAction }) {
    const toneStyles = {
        income: { color: "white", fontWeight: "bold", bgcolor: "success.main" },
        expense: { color: "white", fontWeight: "bold", bgcolor: "error.main" },
        neutral: { color: "white", fontWeight: "bold", bgcolor: "secondary.main" }
    };

    return (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                <Stack spacing={{ xs: 1, sm: 1.5 }}>
                    <Chip
                        label={label}
                        size="small"
                        sx={{
                            alignSelf: "flex-start",
                            color: toneStyles[tone].color,
                            bgcolor: toneStyles[tone].bgcolor,
                            height: { xs: 24, sm: 26 },
                            "& .MuiChip-label": {
                                px: { xs: 1, sm: 1.25 },
                                fontSize: { xs: "0.7rem", sm: "0.75rem" }
                            }
                        }}
                    />
                    <Stack direction="row" spacing={0.5} alignItems="flex-start">
                        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.35rem", sm: "2rem" }, lineHeight: 1.15 }}>
                            {value}
                        </Typography>
                        {actionLabel && onAction ? (
                            <Button
                                variant="text"
                                size="small"
                                onClick={onAction}
                                sx={{ alignSelf: "flex-start", px: 0, minWidth: "auto", mt: { xs: -0.25, sm: 0 } }}
                            >
                                <HelpIcon fontSize="small" />
                            </Button>
                        ) : null}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
