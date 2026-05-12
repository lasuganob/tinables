import { useId, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useAppDataContext } from "../context/AppDataContext";
import { useAppFiltersContext } from "../context/AppFiltersContext";
import { WeekPickerInput } from "./WeekPickerInput";

const fieldSx = {
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.72)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#fff",
  },
  "& .MuiInputBase-root": {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
  },
  "& .MuiSvgIcon-root": {
    color: "rgba(255,255,255,0.72)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.24)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#fff",
  },
};

const labelSx = {
  color: "rgba(255,255,255,0.72)",
  "&.Mui-focused": { color: "#fff" },
};

const selectSx = {
  color: "#fff",
  backgroundColor: "rgba(255,255,255,0.08)",
  borderRadius: 2,
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.72)" },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.24)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.45)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#fff",
  },
};

const selectMenuProps = {
  PaperProps: {
    sx: { maxHeight: 280 },
  },
};

const datePickerSlotProps = {
  textField: {
    fullWidth: true,
    size: "small",
    sx: fieldSx,
  },
  popper: {
    sx: { zIndex: (theme) => theme.zIndex.modal + 1 },
  },
};

const weekPickerStyles = {
  label: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "\"Avenir Next\", \"Segoe UI\", sans-serif",
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 8,
    color: "#fff",
  },
};

export function GlobalFiltersControls() {
  const [isExpanded, setIsExpanded] = useState(false);
  const userLabelId = useId();
  const modeLabelId = useId();
  const quickYearLabelId = useId();

  const { users } = useAppDataContext();
  const {
    selectedUser,
    setSelectedUser,
    dateFilter,
    setDateFilter,
    updateDateFilter,
    toPickerValue,
    availableYears,
    resetFilters,
  } = useAppFiltersContext();

  const hasSelectedUser = users.some((user) => user.name === selectedUser);

  return (
    <Box sx={{ px: 1.5, py: 2, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      <ButtonBase
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse global filters" : "Expand global filters"}
        onClick={() => setIsExpanded((current) => !current)}
        sx={{
          width: "100%",
          borderRadius: 1.5,
          color: "#fff",
          justifyContent: "space-between",
          p: 0.75,
          textAlign: "left",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <FilterListRoundedIcon sx={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.82)" }} />
          <Typography
            variant="subtitle2"
            sx={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.2 }}
          >
            Global Filters
          </Typography>
        </Stack>
        <ExpandMoreRoundedIcon
          sx={{
            color: "rgba(255,255,255,0.82)",
            fontSize: "1.2rem",
            transform: isExpanded ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.18s ease",
          }}
        />
      </ButtonBase>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Stack
          spacing={1.25}
          sx={{
            mt: 1.25,
            maxHeight: { xs: "56vh", md: "50vh" },
            overflowY: "auto",
            pr: 0.25,
          }}
        >
          <FormControl fullWidth size="small">
            <InputLabel id={userLabelId} sx={labelSx}>
              Spendee/Depositor
            </InputLabel>
            <Select
              labelId={userLabelId}
              label="Spendee/Depositor"
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
              MenuProps={selectMenuProps}
              sx={selectSx}
            >
              <MenuItem value="">All</MenuItem>
              {selectedUser && !hasSelectedUser ? (
                <MenuItem value={selectedUser}>{selectedUser}</MenuItem>
              ) : null}
              {users.map((user) => (
                <MenuItem key={user.id} value={user.name}>
                  {user.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id={modeLabelId} sx={labelSx}>
              Filter type
            </InputLabel>
            <Select
              labelId={modeLabelId}
              label="Filter type"
              value={dateFilter.mode}
              onChange={(event) => setDateFilter((current) => ({ ...current, mode: event.target.value }))}
              MenuProps={selectMenuProps}
              sx={selectSx}
            >
              <MenuItem value="all">All dates</MenuItem>
              <MenuItem value="month">By month</MenuItem>
              <MenuItem value="week">By week</MenuItem>
              <MenuItem value="year">By year</MenuItem>
              <MenuItem value="range">Date range</MenuItem>
            </Select>
          </FormControl>

          {dateFilter.mode === "month" ? (
            <DatePicker
              label="Month"
              views={["year", "month"]}
              value={toPickerValue(dateFilter.month ? `${dateFilter.month}-01` : "")}
              onChange={(value) => updateDateFilter("month", value ? value.format("YYYY-MM") : "")}
              slotProps={datePickerSlotProps}
            />
          ) : null}

          {dateFilter.mode === "week" ? (
            <WeekPickerInput
              label="Week"
              value={dateFilter.week}
              onChange={(value) => updateDateFilter("week", value)}
              popoverProps={{ withinPortal: true, zIndex: 1600 }}
              styles={weekPickerStyles}
            />
          ) : null}

          {dateFilter.mode === "year" ? (
            <>
              <DatePicker
                label="Year"
                views={["year"]}
                value={toPickerValue(dateFilter.year ? `${dateFilter.year}-01-01` : "")}
                onChange={(value) => updateDateFilter("year", value ? value.format("YYYY") : "")}
                slotProps={datePickerSlotProps}
              />

              <FormControl fullWidth size="small">
                <InputLabel id={quickYearLabelId} sx={labelSx}>
                  Quick year
                </InputLabel>
                <Select
                  labelId={quickYearLabelId}
                  label="Quick year"
                  value={dateFilter.year}
                  onChange={(event) => updateDateFilter("year", event.target.value)}
                  MenuProps={selectMenuProps}
                  sx={selectSx}
                >
                  <MenuItem value="">Select year</MenuItem>
                  {availableYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : null}

          {dateFilter.mode === "range" ? (
            <>
              <DatePicker
                label="Start date"
                value={toPickerValue(dateFilter.startDate)}
                onChange={(value) => updateDateFilter("startDate", value ? value.format("YYYY-MM-DD") : "")}
                slotProps={datePickerSlotProps}
              />
              <DatePicker
                label="End date"
                value={toPickerValue(dateFilter.endDate)}
                onChange={(value) => updateDateFilter("endDate", value ? value.format("YYYY-MM-DD") : "")}
                slotProps={datePickerSlotProps}
              />
            </>
          ) : null}

          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={resetFilters}
            sx={{
              minHeight: 38,
              color: "#fff",
              borderColor: "rgba(255,255,255,0.32)",
              "&:hover": {
                borderColor: "#fff",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Clear Filters
          </Button>
        </Stack>
      </Collapse>
    </Box>
  );
}
