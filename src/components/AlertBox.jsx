import { Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export function AlertBox({ message, severity, onClose, sx = {} }) {
    return (
        <Alert
            variant="outlined"
            severity={severity}
            sx={{
                m: 2,
                mb: 0,
                backgroundColor: severity === "error" ? "#ffcdcdff" : "#d4edda",
                ...sx
            }}
            action={
                <IconButton
                    aria-label="close error"
                    color="inherit"
                    size="small"
                    onClick={onClose}
                >
                    <CloseIcon fontSize="inherit" />
                </IconButton>
            }
        >
            {message}
        </Alert>
    );
}