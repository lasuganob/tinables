import { Chip, Stack, Typography } from "@mui/material";

export function TagBadges({ tagValues, tagNameById }) {
    if (!tagValues?.length) {
        return <Typography variant="body2" color="text.secondary">-</Typography>;
    }

    return (
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {tagValues.map((tagValue, index) => (
                <Chip
                    key={`${tagValue}-${index}`}
                    label={tagNameById.get(String(tagValue)) || String(tagValue)}
                    size="small"
                    color="secondary"
                    variant="outlined"
                />
            ))}
        </Stack>
    );
}
