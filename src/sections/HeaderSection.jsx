import { Box, Paper, Stack, Typography } from "@mui/material";

export function HeaderSection() {
    return (
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: "1px solid", borderColor: "divider" }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }}>
                <Box>
                    <Typography variant="h3" fontWeight={800}>Tinables Cashflow</Typography>
                </Box>
            </Stack>
        </Paper>
    );
}
