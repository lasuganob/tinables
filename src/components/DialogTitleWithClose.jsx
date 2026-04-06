import { DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export function DialogTitleWithClose({
    children,
    onClose,
    disabled = false
}) {
    return (
        <DialogTitle sx={{ pr: 7 }}>
            <Typography variant="h6" component="span">
                {children}
            </Typography>
            <Stack
                direction="row"
                sx={{
                    position: "absolute",
                    right: 8,
                    top: 8
                }}
            >
                <IconButton
                    aria-label="Close dialog"
                    onClick={onClose}
                    disabled={disabled}
                    edge="end"
                    size="small"
                >
                    <CloseRoundedIcon />
                </IconButton>
            </Stack>
        </DialogTitle>
    );
}
