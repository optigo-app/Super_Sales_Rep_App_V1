import React from "react";
import {
    Box,
    Typography,
    TextField,
    ToggleButtonGroup,
    ToggleButton,
    Button,
} from "@mui/material";

const RoundOffBox = ({
    totalAmount = 0,
    roundUpTotalAmount,
    roundType,
    roundValue,
    pendingNote = true,
    onToggleChange,
    onValueChange,
    onRoundup,
}) => {
    return (
        <Box
            sx={{
                border: "1px solid #989898",
                padding: 2,
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#fff",
                borderRadius: 0,
                boxShadow: "none",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                position: "relative",
            }}
        >
            {/* Total Amount */}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography fontSize={14} color="text.secondary">
                    Total Amount
                </Typography>
                <Typography fontSize={20} fontWeight={600}>
                    {typeof totalAmount == 'number' ? totalAmount.toFixed(2) : (parseFloat(totalAmount) || 0)?.toFixed(2)}
                </Typography>
            </Box>

            {/* Roundoff Amount */}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography fontSize={14} color="text.secondary">
                    Roundoff Amount
                </Typography>
                <Typography fontSize={16} fontWeight={500}>
                    {roundValue ?? ''}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "end",
                    gap: "10px",
                }}
            >
                <Box sx={{ display: "flex", gap: 1 }}>
                    <button onClick={onRoundup} style={{
                        backgroundColor: "#9349d2",
                        color: 'white',
                        border: 'none',
                        padding: '7px',
                        borderRadius: '5px'
                    }}>
                        ROUNDUP
                    </button>
                </Box>

                <ToggleButtonGroup
                    value={roundType}
                    exclusive
                    onChange={onToggleChange}
                    fullWidth
                    size="small"
                    sx={{
                        mt: 1,
                    }}
                >
                    <ToggleButton
                        value="less"
                        sx={{
                            fontSize: 14,
                            textTransform: "none",
                            padding: "4px 12px",
                            "&.Mui-selected": {
                                backgroundColor: "#9349d2 !important",
                                color: "#fff",
                                "&:hover": {
                                    backgroundColor: "#707070",
                                },
                            },
                        }}
                    >
                        Less
                    </ToggleButton>

                    <ToggleButton
                        value="add"
                        sx={{
                            fontSize: 14,
                            textTransform: "none",
                            padding: "4px 12px",
                            "&.Mui-selected": {
                                backgroundColor: "#9349d2 !important",
                                color: "#fff",
                                "&:hover": {
                                    backgroundColor: "#707070",
                                },
                            },
                        }}
                    >
                        Add
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Input Field */}
            <Box>
                <Typography fontSize={12} sx={{ mb: 0.5 }}>
                    Add / Less
                </Typography>
                <TextField
                    size="small"
                    type="number"
                    fullWidth
                    value={roundValue ?? ''}
                    onChange={onValueChange}
                    placeholder="Enter value"
                    inputProps={{
                        onFocus: (e) => {
                            setTimeout(() => {
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 450);
                        }
                    }}
                />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography fontSize={14} color="text.secondary">
                    Final Amount
                </Typography>
                <Typography fontSize={20} fontWeight={600}>
                    {roundUpTotalAmount ? roundUpTotalAmount : totalAmount}
                </Typography>
            </Box>
            {pendingNote == true && (
                <Typography fontSize={12} color="error" sx={{ mt: 1 }}>
                    <strong>Round Off Pending.</strong>{" "}
                    <span
                        style={{
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontWeight: 500,
                        }}
                        onClick={onRoundup}
                    >
                        Click on Roundup
                    </span>{" "}
                    to apply round off.
                </Typography>
            )}
        </Box>
    );
};

export default RoundOffBox;
