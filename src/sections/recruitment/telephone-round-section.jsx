import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { useBoolean } from 'src/hooks/use-boolean';
import { useInterviews } from 'src/hooks/use-interviews';

import { fDate } from 'src/utils/format-time';
import { createGoogleCalendarEventUrl, listenForCalendarEventCreation } from 'src/utils/calendar';

import { supabase } from 'src/lib/supabase';

import { Iconify } from 'src/components/iconify';
import { TableNoData } from 'src/components/table';
import { Scrollbar } from 'src/components/scrollbar';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function TelephoneRoundSection({ filters }) {
  const [currentTab, setCurrentTab] = useState('eligible');
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');
  const [scheduleDate, setScheduleDate] = useState(null);
  const [interviewer, setInterviewer] = useState('');
  const [assignedBy, setAssignedBy] = useState('');
  const [duration, setDuration] = useState('');
  const [calendarEventCreated, setCalendarEventCreated] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [hrUsers, setHrUsers] = useState([]);

  const statusDialog = useBoolean();
  const loading = useBoolean();
  const { user } = useAuthContext();

  const { interviews, applications, fetchInterviews, scheduleInterview, updateInterviewStatus } = useInterviews();

  // Fetch HR users
  useEffect(() => {
    const fetchHrUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('user_info')
          .select('id, full_name, email')
          .eq('role', 'HR');

        if (error) throw error;
        setHrUsers(data || []);
      } catch (error) {
        console.error('Error fetching HR users:', error);
      }
    };

    fetchHrUsers();
  }, []);

  useEffect(() => {
    fetchInterviews('telephone', filters);
  }, [fetchInterviews, filters]);

  // Filter out applications that already have scheduled interviews
  const eligibleApplications = applications.filter((app) => {
    const hasScheduledInterview = interviews.some(
      (interview) => 
        interview.application_id === app.id && 
        interview.stage === 'telephone' &&
        ['scheduled', 'shortlisted', 'rejected'].includes(interview.status)
    );
    return !hasScheduledInterview;
  });

  const scheduledInterviews = interviews.filter(
    (interview) => interview.status === 'scheduled'
  );

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleScheduleInterview = async () => {
    try {
      loading.onTrue();
      
      const selectedApplication = applications.find(app => app.id === selectedApplications[0]);
      if (selectedApplication && scheduleDate) {
        // First create the calendar event
        const startTime = new Date(scheduleDate);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);

        const eventUrl = createGoogleCalendarEventUrl({
          title: `Interview with F13 Technologies - Telephone Round`,
          description: `Telephone interview round with F13 Technologies\nInterviewer: ${interviewer}\nAssigned By: ${assignedBy}`,
          startTime,
          endTime,
          attendeeEmail: selectedApplication.email,
          location: 'Phone Call',
        });

        // Open calendar in new window
        const calendarWindow = window.open(eventUrl, '_blank');
        
        // Listen for event creation
        const eventCreated = await listenForCalendarEventCreation(calendarWindow);

        if (eventCreated) {
          // Show confirmation dialog
          setConfirmDialog({
            open: true,
            title: 'Calendar Event Confirmation',
            message: 'Did you successfully schedule the calendar event?',
            onConfirm: async () => {
              try {
                // Schedule the interview internally
                await scheduleInterview({
                  applicationIds: selectedApplications,
                  stage: 'telephone',
                  status: 'scheduled',
                  scheduleDate,
                  interviewer,
                  assignedBy,
                });

                // Reset form
                setScheduleDialog(false);
                setSelectedApplications([]);
                setScheduleDate(null);
                setInterviewer('');
                setAssignedBy('');
                setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });

                // Fetch updated interviews
                await fetchInterviews('telephone', filters);
              } catch (error) {
                setConfirmDialog({
                  open: true,
                  title: 'Error',
                  message: 'An error occurred while scheduling the interview. Please try again.',
                  onConfirm: () => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })
                });
              }
            },
            onCancel: () => {
              setConfirmDialog({
                open: true,
                title: 'Action Required',
                message: 'Please schedule the calendar event before proceeding.',
                onConfirm: () => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })
              });
            }
          });
        } else {
          setConfirmDialog({
            open: true,
            title: 'Calendar Event Failed',
            message: 'Calendar event creation failed or timed out. Please try again.',
            onConfirm: () => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setConfirmDialog({
        open: true,
        title: 'Error',
        message: 'An error occurred while scheduling the interview. Please try again.',
        onConfirm: () => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })
      });
    } finally {
      loading.onFalse();
    }
  };

  const handleUpdateStatus = async () => {
    try {
      loading.onTrue();
      const feedbackData = {
        duration,
        feedback,
      };
      await updateInterviewStatus({
        applicationIds: selectedApplications,
        status,
        feedback: JSON.stringify(feedbackData),
      });
      statusDialog.onFalse();
      setSelectedApplications([]);
      setStatus('');
      setFeedback('');
      setDuration('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      loading.onFalse();
    }
  };

  const handleGoogleCalendar = () => {
    // Open the schedule dialog instead of directly creating calendar event
    setScheduleDialog(true);
  };

  const renderEligibleCandidates = (
    <TableContainer>
      <Scrollbar>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedApplications.length > 0 && selectedApplications.length < eligibleApplications.length
                  }
                  checked={eligibleApplications.length > 0 && selectedApplications.length === eligibleApplications.length}
                  onChange={(event) =>
                    setSelectedApplications(
                      event.target.checked ? eligibleApplications.map((app) => app.id) : []
                    )
                  }
                />
              </TableCell>
              <TableCell>Applicant Name</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Application Date</TableCell>
              <TableCell>Resume</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {eligibleApplications.map((application) => {
              const isSelected = selectedApplications.includes(application.id);

              return (
                <TableRow key={application.id} hover selected={isSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) =>
                        setSelectedApplications(
                          event.target.checked
                            ? [...selectedApplications, application.id]
                            : selectedApplications.filter((id) => id !== application.id)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{application.applicant_name}</TableCell>
                  <TableCell>{application.job?.title}</TableCell>
                  <TableCell>{fDate(application.created_at)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Iconify icon="eva:download-outline" />}
                      href={application.resume_url}
                      target="_blank"
                    >
                      Resume
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color={statusDialog.value ? 'inherit' : 'default'}>
                      <Iconify icon="eva:more-vertical-fill" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}

            <TableNoData notFound={!eligibleApplications.length} />
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );

  const renderScheduledInterviews = (
    <TableContainer>
      <Scrollbar>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedApplications.length > 0 && selectedApplications.length < scheduledInterviews.length
                  }
                  checked={scheduledInterviews.length > 0 && selectedApplications.length === scheduledInterviews.length}
                  onChange={(event) =>
                    setSelectedApplications(
                      event.target.checked ? scheduledInterviews.map((interview) => interview.application_id) : []
                    )
                  }
                />
              </TableCell>
              <TableCell>Applicant Name</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Interview Date</TableCell>
              <TableCell>Interviewer</TableCell>
              <TableCell>Assigned By</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduledInterviews.map((interview) => {
              const isSelected = selectedApplications.includes(interview.application_id);

              return (
                <TableRow key={interview.id} hover selected={isSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) =>
                        setSelectedApplications(
                          event.target.checked
                            ? [...selectedApplications, interview.application_id]
                            : selectedApplications.filter((id) => id !== interview.application_id)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{interview.application?.applicant_name}</TableCell>
                  <TableCell>{interview.application?.job?.title}</TableCell>
                  <TableCell>{fDate(interview.schedule_date)}</TableCell>
                  <TableCell>{interview.interviewer}</TableCell>
                  <TableCell>{interview.assigned_by}</TableCell>
                  <TableCell>{interview.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedApplications([interview.application_id]);
                        statusDialog.onTrue();
                      }}
                    >
                      Update Status
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            <TableNoData notFound={!scheduledInterviews.length} />
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );

  const renderScheduleDialog = (
    <Dialog 
      fullWidth 
      maxWidth="sm" 
      open={scheduleDialog} 
      onClose={() => setScheduleDialog(false)}
    >
      <DialogTitle>Schedule Telephone Interview</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <DatePicker
            label="Interview Date"
            value={scheduleDate}
            onChange={(newValue) => setScheduleDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !scheduleDate,
              },
            }}
          />

          <TimePicker
            label="Interview Time"
            value={scheduleDate}
            onChange={(newValue) => setScheduleDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !scheduleDate,
              },
            }}
          />

          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="Interviewer"
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: { maxHeight: 220 },
                  },
                },
              }}
            >
              <MenuItem value="">Select Interviewer</MenuItem>
              {hrUsers.map((hrUser) => (
                <MenuItem key={hrUser.id} value={hrUser.full_name}>
                  {hrUser.full_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Assigned By"
              value={assignedBy}
              onChange={(e) => setAssignedBy(e.target.value)}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: { maxHeight: 220 },
                  },
                },
              }}
            >
              <MenuItem value="">Select Assigner</MenuItem>
              {hrUsers.map((hrUser) => (
                <MenuItem key={hrUser.id} value={hrUser.full_name}>
                  {hrUser.full_name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              bgcolor: 'action.selected', 
              p: 2, 
              borderRadius: 1,
              textAlign: 'center'
            }}
          >
            AFTER THIS YOU WILL BE REDIRECTED TO CALENDAR EVENT SCHEDULING
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={() => setScheduleDialog(false)}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={loading.value}
          onClick={handleScheduleInterview}
          disabled={!scheduleDate || !interviewer || !assignedBy}
        >
          Schedule
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  const renderStatusDialog = (
    <Dialog 
      fullWidth 
      maxWidth="sm" 
      open={statusDialog.value} 
      onClose={statusDialog.onFalse}
    >
      <DialogTitle>Update Interview Status</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            select
            fullWidth
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            SelectProps={{
              native: true,
            }}
          >
            <option value="" />
            <option value="shortlisted">Shortlist</option>
            <option value="rejected">Reject</option>
            <option value="standby">Standby</option>
          </TextField>

          <TextField
            fullWidth
            label="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            error={!duration}
            type="number"
            inputProps={{ min: 0 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required={status !== 'standby'}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={statusDialog.onFalse}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={loading.value}
          onClick={handleUpdateStatus}
          disabled={!status || (!duration && status !== 'standby') || (!feedback && status !== 'standby')}
        >
          Update
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  const renderConfirmDialog = (
    <Dialog
      open={confirmDialog.open}
      onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
    >
      <DialogTitle>{confirmDialog.title}</DialogTitle>
      <DialogContent>
        <Typography>{confirmDialog.message}</Typography>
      </DialogContent>
      <DialogActions>
        {confirmDialog.onCancel && (
          <Button onClick={() => {
            confirmDialog.onCancel();
          }}>
            No
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => {
            if (confirmDialog.onConfirm) {
              confirmDialog.onConfirm();
            } else {
              setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
            }
          }}
        >
          {confirmDialog.onCancel ? 'Yes' : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Card>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            px: 2.5,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.palette.divider}`,
          }}
        >
          <Tab value="eligible" label="Eligible Candidates" />
          <Tab value="scheduled" label="Scheduled Interviews" />
        </Tabs>

        <Stack
          spacing={2.5}
          direction="row"
          justifyContent="flex-end"
          sx={{ p: 2.5, bgcolor: 'background.neutral' }}
        >
          {currentTab === 'eligible' ? (
            <>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mdi:google-calendar" />}
                onClick={handleGoogleCalendar}
                disabled={!selectedApplications.length}
              >
                Schedule with Google Calendar
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={statusDialog.onTrue}
              disabled={!selectedApplications.length}
            >
              Update Status
            </Button>
          )}
        </Stack>

        {currentTab === 'eligible' ? renderEligibleCandidates : renderScheduledInterviews}
      </Card>

      {renderScheduleDialog}
      {renderStatusDialog}
      {renderConfirmDialog}
    </>
  );
}

TelephoneRoundSection.propTypes = {
  filters: PropTypes.object,
}; 