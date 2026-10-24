import { TextField, Autocomplete, InputAdornment } from "@mui/material";
import { memo } from "react";
import { TbProgress } from "react-icons/tb";


const TaskStatusAutocomplete = memo(({ editTask, handleStatusChange, statusOptions ,disabled }) => {
    return (
        <Autocomplete
            sx={{
                display: "flex",
                flex: 1,
                width: "100%",
            }}
            disabled={disabled}
            id="status-select"
            options={statusOptions}
            value={editTask?.Status || null}
            onChange={(event, newValue) => handleStatusChange(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Task Status"
                    size="small"
                    fullWidth
                    sx={{
                        fontSize: "0.875rem", // Adjust font size as needed
                        fontWeight: 500,
                    }}
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <TbProgress
                                        fontSize={24}
                                        style={{
                                            color: "rgba(172, 172, 172, 0.747)",
                                            marginLeft: 2,
                                        }}
                                    />
                                    {params.InputProps?.startAdornment}
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            )}
        />
    );
});

export default TaskStatusAutocomplete;