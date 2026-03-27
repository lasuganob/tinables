import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

export function StatCard({ label, value, tone = "neutral" }) {
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
                    <Typography variant="h4" fontWeight={700}>
                        {value}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}
