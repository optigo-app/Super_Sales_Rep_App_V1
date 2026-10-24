import { Box, Typography, Paper, TextField, Button, List, Divider, Chip, InputAdornment, Tooltip, Stack, Accordion, AccordionSummary, AccordionDetails, AccordionActions, Autocomplete, FormControl, FormLabel } from "@mui/material";
import { Person as PersonIcon, Work as WorkIcon, Notes as NotesIcon } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { statusOptions } from "../lib/constants";
import { IoIosFlag } from "react-icons/io";
import dayjs from "dayjs";
import { formatDate, getPriorityColor, priorityOptions } from "../lib/functions";
import { useStore } from "../context/useTasks";
import { useAuth } from "../context/UseAuth";
import { memo } from "react";
import { TablePagination } from "@mui/material";
import TaskTitle from "./TaskTitle";
import TaskStatusAutocomplete from "./TaskStatusAutocomplete";
import LoadingScreen from "./LoadingScreen";
import NoTasks from "./NoTasks";
import DepartmentAssigneeAutocomplete from "./DepartmentAssigneeAutocomplete";



const TaskList = memo(({ handleAssigned, count, page, rowsPerPage, setPage, setRowsPerPage, searchQuery, editTask, setEditTask, filteredTasks, expandedId, handleAccordionChange, handleStatusChange, handleDateChange, handleAccordionCancel, HandleEditTodo }) => {
  const { handleClickOpen, loading, employeeList } = useStore();
  const { user } = useAuth();
  return (
    <>
      <List
        sx={{
          width: "100%",
          height: "60vh",
          overflow: "auto",
          px: 1,
        }}
      >
        {loading ? (
          <LoadingScreen />
        ) : filteredTasks?.length > 0 ? (
          [...filteredTasks]
            ?.map((task, i) => {
              const isExpanded = expandedId === task?.TaskId;
              const date = (task?.EntryDate && formatDate(task?.EntryDate)) || "";

              const isCreator = Number(user?.UserID) === Number(task?.UserId);   // ✅
              const isAssignee = Number(user?.UserID) === Number(task?.AssignedTo); // ✅
              const isClosed = task?.Status?.toLowerCase() === "closed";

              const permissions = {
                canEditAll: isCreator,
                canEditStatus: isCreator || (isAssignee && !isClosed),
                canEditRemarks: isCreator || (isAssignee && !isClosed),
                canEditAssignee: isCreator,
                canEditDescription: isCreator,
                canEditDeadline: isCreator,
                canEditPriority: isCreator,
                canSave: isCreator || (isAssignee && !isClosed),
              };
              return (
                <Paper
                  key={task?.TaskId}
                  elevation={1}
                  sx={{
                    mb: 2,
                  }}
                >
                  <Accordion key={i} expanded={isExpanded} onChange={handleAccordionChange(task?.TaskId, task)}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`panel-${task?.TaskId}-content`}
                      id={`panel-${task?.TaskId}-header`}
                      sx={{
                        pl: 2.5,
                        py: 0,
                        borderRadius: "8px",
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          flex: 1,
                          width: "100%",
                        }}
                      >
                        <Typography
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                              color: task.completed ? "text.secondary" : "text.primary",
                              maxWidth: searchQuery?.split("")?.length > 1 ? 200 : 500,
                              overflow: "hidden",
                              flexWrap: "nowrap",
                            }}
                          >
                            {task.Priority !== "none" ? (
                              <Tooltip title={task?.Priority}>
                                <Chip
                                  size="small"
                                  sx={{
                                    mr: 1,
                                    height: 15,
                                    fontSize: "0.5rem",
                                    backgroundColor: getPriorityColor(task?.Priority),
                                    color: "#fff",
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Normal">
                                <Chip
                                  size="small"
                                  color="default"
                                  sx={{
                                    mr: 1,
                                    height: 15,
                                    fontSize: "0.5rem",
                                  }}
                                />
                              </Tooltip>
                            )}

                            <Box
                              component="span"
                              sx={{
                                flex: 1,
                                textDecoration: task.completed ? "line-through" : "none",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {task?.Title}
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              fontSize: "11px",
                              color: "gray",
                              pr: 0.2,
                              whiteSpace: "nowrap",
                              flexDirection: "column",
                            }}
                          >
                            {date}
                          </Box>
                          {searchQuery?.split("")?.length > 1 && task?.DesignationId && task?.AssignedName && (
                            <Typography
                              sx={{
                                ml: "15px",
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                              }}
                            >
                              <Chip label={`@${task?.DesignationId}`} size="small" sx={{ fontSize: "12px", py: 0 }} color="info" />
                              <Chip label={`@${task?.AssignedName}`} size="small" sx={{ fontSize: "12px", py: 0 }} color="primary" />
                            </Typography>
                          )}
                        </Typography>
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "11px",
                          position: "absolute",
                          bottom: "-1.5px",
                          right: "30px",
                          fontStyle: "italic",
                          color: "#666",
                        }}
                      >
                        {(() => {
                          if (task.UserId === user?.UserID && task.AssignedName) {        // ✅
                            return `assigned to ${task.AssignedName}`;
                          } else if (task.UserId !== user?.UserID && task.UserName) {     // ✅
                            return `assigned by ${task.UserName}.`;
                          }
                          return null;
                        })()}
                      </Typography>
                    </AccordionSummary>
                    {isExpanded && (
                      <AccordionDetails>
                        <Divider />
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2.5,
                          }}
                        >
                          {/* Completed Checkbox and Title */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <TaskTitle isCreator={isCreator} editTask={editTask} setEditTask={setEditTask} key={editTask?.id} />
                          </Box>

                          <Stack spacing={{ xs: 1, sm: 2 }} direction="row" useFlexGap sx={{ flexWrap: "wrap" }}>
                            <TaskStatusAutocomplete disabled={!permissions.canEditStatus} statusOptions={statusOptions} editTask={editTask} handleStatusChange={handleStatusChange} />
                            {/* Due Date Picker */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                label="Due Date"
                                format="DD-MM-YYYY"
                                value={editTask?.DueDate ? dayjs(editTask.DueDate) : null}
                                onChange={handleDateChange}
                                sx={{
                                  display: "flex",
                                  flex: 1,
                                  width: "100%",
                                }}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    size: "small",
                                  },
                                }}
                                disabled={!permissions.canEditDeadline}
                              />
                            </LocalizationProvider>
                          </Stack>

                          <Stack spacing={{ xs: 1, sm: 2 }} direction="row" useFlexGap sx={{ flexWrap: "wrap" }}>
                            <DepartmentAssigneeAutocomplete
                              options={employeeList}
                              label="Assignee"
                              onChange={handleAssigned}
                              disabled={!permissions.canEditAssignee}
                              value={
                                editTask?.selectedUserData || {
                                  userId: editTask?.AssignedTo || editTask?.AssignedId,
                                  user: editTask?.AssignedName,
                                  designation: editTask?.DesignationId,
                                  designationId: editTask?.DesignationParentId || editTask?.DesignaitonId,
                                }
                              }
                            />
                          </Stack>
                          <Stack spacing={{ xs: 1, sm: 2 }} direction="row" useFlexGap sx={{ flexWrap: "wrap" }}>
                            <FormControl
                              size="small"
                              component="fieldset"
                              sx={{
                                display: "flex",
                                flex: 1,
                                width: "100%",
                              }}
                              disabled={!permissions.canEditPriority}
                            >
                              <FormLabel
                                component="legend"
                                sx={{
                                  fontSize: "small",
                                  mt: -2,
                                  mb: 0,
                                  px: 1.5,
                                }}
                              >
                                Priority
                              </FormLabel>
                              <fieldset disabled={!permissions.canEditPriority} style={{ border: "none", padding: 0, margin: 0 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    padding: "4px",
                                    opacity: permissions.canEditPriority ? 1 : 0.5,
                                    pointerEvents: permissions.canEditPriority ? "auto" : "none", // disables all clicks inside
                                  }}
                                  disabled={!permissions.canEditPriority}
                                >
                                  {priorityOptions?.map((option) => {
                                    return (
                                      <Tooltip title={option?.label}>
                                        <Typography>
                                          <IoIosFlag
                                            key={option.value}
                                            style={{
                                              color: option.color,
                                              cursor: "pointer",
                                              transition: "color 0.2s",
                                              border: editTask?.Priority?.toLowerCase() === option.value ? "1px solid rgba(0,0,0,0.2)" : "none",
                                              padding: "1px",
                                              cursor: permissions.canEditPriority ? "pointer" : "not-allowed",
                                            }}
                                            fontSize={25}
                                            onClick={() => {
                                              if (!permissions.canEditPriority) return;
                                              setEditTask((prev) => ({
                                                ...prev,
                                                Priority: prev?.Priority === option.value ? "none" : option.value,
                                              }));
                                            }}
                                          />
                                        </Typography>
                                      </Tooltip>
                                    );
                                  })}
                                </Box>
                              </fieldset>
                            </FormControl>
                          </Stack>
                          {/* Notes */}
                          <TextField
                            label="Remarks"
                            fullWidth
                            multiline
                            size="small"
                            rows={4}
                            value={editTask?.Description || ""}
                            onChange={(e) => {
                              setEditTask((prev) => ({ ...prev, Description: e.target.value }));
                            }}
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment
                                    position="start"
                                    sx={{
                                      alignSelf: "flex-start",
                                      mt: 0.5,
                                      mr: 1,
                                    }}
                                  >
                                    <NotesIcon color="action" />
                                  </InputAdornment>
                                ),
                              },
                            }}
                            disabled={!permissions.canEditRemarks}
                          />
                        </Box>
                      </AccordionDetails>
                    )}
                    {isExpanded && (
                      <AccordionActions>
                        {permissions?.canSave && (
                          <Button
                            onClick={handleAccordionCancel}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 500,
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        {isCreator && (
                          <Button
                            variant="contained"
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 500,
                              bgcolor: "red",
                              color: "white",
                              ":hover": {
                                bgcolor: "red",
                              },
                            }}
                            onClick={() => handleClickOpen(task?.TaskId)}
                          >
                            Delete
                          </Button>
                        )}
                        {permissions?.canSave && (
                          <Button
                            onClick={HandleEditTodo}
                            variant="contained"
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 500,
                            }}
                          >
                            Save
                          </Button>
                        )}
                      </AccordionActions>
                    )}
                  </Accordion>
                </Paper>
              );
            })
        ) : (
          <NoTasks />
        )}
      </List>
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setPage(0);
          setRowsPerPage(parseInt(e.target.value, 10));
        }}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Rows"
        showFirstButton
        showLastButton
        sx={{
          px: 2,
          backgroundColor: (theme) => theme.palette.background.paper,
          "& .MuiTablePagination-toolbar": {
            gap: 0.5,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            paddingLeft: 0,
            paddingRight: 0,
          },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: 13,
            color: "text.secondary",
          },
          "& .MuiTablePagination-select": {
            fontSize: 13,
            "&:focus": {
              backgroundColor: "transparent",
            },
          },
          "& .MuiTablePagination-actions": {
            "& .MuiIconButton-root": {
              borderRadius: 6,
              backgroundColor: "rgba(148, 148, 148, 0.07)",
              mx: 0.2,
              "& svg": {
                fontSize: 18,
              },
            },
          },
        }}
      />
    </>
  );
});

export default TaskList;