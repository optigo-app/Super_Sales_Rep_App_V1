import React, { useEffect, useState } from "react";
import { Autocomplete, InputAdornment, TextField } from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

export default function DepartmentAssigneeAutocomplete({ options, placeholder = "Select assignees", limitTags = 2, onChange, value, error, multiple = false, helperText, disabled = false }) {
  const [selectedValues, setSelectedValues] = useState(multiple ? [] : null);

  useEffect(() => {
    setSelectedValues(value || (multiple ? [] : null));
  }, [value, multiple]);

  const handleChange = (event, newValue) => {
    setSelectedValues(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const getFullName = (emp) => `${emp.user}`;
  const getDeptAssignee = (emp) => `${emp.designation} / ${getFullName(emp)}`;

  const filterOptions = (options, { inputValue }) => options.filter((emp) => getFullName(emp).toLowerCase().includes(inputValue.toLowerCase()) || emp.designation.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <>
      <Autocomplete
        limitTags={limitTags}
        options={options}
        disabled={disabled}
        filterOptions={filterOptions}
        getOptionLabel={(option) => (option && option.user ? getDeptAssignee(option) : "")}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selectedValues}
        onChange={handleChange}
        
        fullWidth
        renderOption={(props, option) => {
          return (
            <li {...props} key={option.id} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "14px" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "bottom" }}>{option?.designation}</span> / {option?.user}
              </div>
            </li>
          );
        }}
        renderInput={(params) => <TextField
        
         
          variant="outlined" {...params} placeholder={multiple ? (selectedValues.length === 0 ? placeholder : "") : !selectedValues || !selectedValues.user ? placeholder : ""} label="Assignee" fullWidth size="small" error={error} helperText={helperText}
          
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <PersonRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                  {params.InputProps?.startAdornment}
                </>
              ),
            },
          }}/>}
       
      />
    </>
  );
}
