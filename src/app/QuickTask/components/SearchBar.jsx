import { InputAdornment, TextField } from "@mui/material";
import { Search } from "lucide-react";
import React, { memo, useMemo, useState, useCallback, useEffect } from "react";
import debounce from "lodash/debounce";

const SearchBar = memo(({ filters, handleSearchChange }) => {
  const [tempSearch, setTempSearch] = useState(filters || "");

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        handleSearchChange(value);
      }, 300),
    [handleSearchChange]
  );

   useEffect(() => {
    setTempSearch(filters || "");
  }, [filters]);

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setTempSearch(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <TextField
      placeholder="Search tasks..."
      size="small"
      fullWidth
      value={tempSearch}
      sx={{ width: { xs: '100%', sm: 280 } }}
      onChange={handleInputChange}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} />
            </InputAdornment>
          ),
        },
      }}
    />
  );
});

export default SearchBar;
