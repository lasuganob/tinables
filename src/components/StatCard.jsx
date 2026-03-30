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
            <CardContent>
                <Stack spacing={1.5}>
                    <Chip
                        label={label}
                        size="small"
                        sx={{
                            alignSelf: "flex-start",
                            color: toneStyles[tone].color,
                            bgcolor: toneStyles[tone].bgcolor
                        }}
                    />
                    <Stack direction="row">
                        <Typography variant="h4" fontWeight={700}>
                            {value}
                        </Typography>
                        {actionLabel && onAction ? (
                            <Button variant="text" size="small" onClick={onAction} sx={{ alignSelf: "flex-start", px: 0, minWidth: "auto" }}>
                                <HelpIcon fontSize="small" />
                            </Button>
                        ) : null}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
