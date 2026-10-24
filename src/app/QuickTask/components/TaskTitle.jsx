import { TextField, InputAdornment } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import ModeEditOutlineRoundedIcon from "@mui/icons-material/ModeEditOutlineRounded";

const TaskTitleInput = ({ editTask, setEditTask, isCreator }) => {
  const [tempTitle, setTempTitle] = useState(editTask?.Title || "");

  useEffect(() => {
    setTempTitle(editTask?.Title || "");
  }, [editTask?.Title]);

  const debouncedSync = useMemo(
    () =>
      debounce((val) => {
        setEditTask((prev) => ({ ...prev, Title: val }));
      }, 300),
    [setEditTask]
  );

  useEffect(() => {
    debouncedSync(tempTitle);
    return () => debouncedSync.cancel();
  }, [tempTitle, debouncedSync]);

  return (
    <TextField
    disabled={!isCreator}
      placeholder="Task Title"
      name="Task Title"
      id="Task Title"
      variant="standard"
      multiline
      fullWidth
      value={tempTitle}
      onChange={(e) => setTempTitle(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <ModeEditOutlineRoundedIcon fontSize="medium" />
            </InputAdornment>
          ),
          disableUnderline: true,
          sx: {
            fontSize: "1rem",
            fontWeight: 500,
            marginTop: "0.5rem",
            "&::placeholder": {
              opacity: 0.7,
            },
          },
        },
      }}
    />
  );
};

export default React.memo(TaskTitleInput);


  {/* <TextField
                              placeholder="Task Title"
                              name="Task Title"
                              id="Task Title"
                              value={editTask?.Title || ""}
                              onChange={(e) => {
                                e.preventDefault();
                                setEditTask((prev) => ({ ...prev, Title: e.target.value }));
                              }}
                              variant="standard"
                              multiline
                              fullWidth
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <ModeEditOutlineRoundedIcon fontSize="medium" />
                                  </InputAdornment>
                                ),
                                disableUnderline: true,
                                sx: {
                                  fontSize: "1rem",
                                  fontWeight: 500,
                                  marginTop: "0.5rem",
                                  "&::placeholder": {
                                    opacity: 0.7,
                                  },
                                },
                              }}
                            /> */}