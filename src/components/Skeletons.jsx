import { Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export function SectionSkeleton({ lines = 4 }) {
    return (
        <Stack spacing={2}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={index === 0 ? 52 : 44} />
            ))}
        </Stack>
    );
}

export function TableSkeleton({ rows = 5, columns = 7 }) {
    return (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {Array.from({ length: columns }).map((_, index) => (
                            <TableCell key={index}><Skeleton width="70%" /></TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {Array.from({ length: columns }).map((__, columnIndex) => (
                                <TableCell key={columnIndex}><Skeleton /></TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
