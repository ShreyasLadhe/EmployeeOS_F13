import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';

// ----------------------------------------------------------------------

export function JobDetailsContent({ job, sx, ...other }) {
  const domain = 'ec2-3-6-91-233.ap-south-1.compute.amazonaws.com:5173';
  const applicationLink = `${domain}${paths.public.jobApplication(job.id)}`;

  const renderContent = () => (
    <Card
      sx={{
        p: 3,
        gap: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h4">{job?.title}</Typography>
        
        <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Application Link:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              wordBreak: 'break-all',
              color: 'primary.main',
              cursor: 'text'
            }}
          >
            {applicationLink}
          </Typography>
        </Box>
      </Stack>

      <Markdown children={job?.description} />
    </Card>
  );

  const renderOverview = () => (
    <Card
      sx={{
        p: 3,
        gap: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {[
        {
          label: 'Department',
          value: job?.department,
          icon: <Iconify icon="solar:user-id-bold" />,
        },
        {
          label: 'Location',
          value: job?.location,
          icon: <Iconify icon="solar:map-point-bold" />,
        },
        {
          label: 'Positions',
          value: `${job?.positions} position${job?.positions > 1 ? 's' : ''}`,
          icon: <Iconify icon="solar:users-group-rounded-bold" />,
        },
        {
          label: 'Job Type',
          value: job?.is_internship ? 'Internship' : 'Full Time',
          icon: <Iconify icon="carbon:skill-level-basic" />,
        },
        {
          label: 'Joining Type',
          value: job?.joining_type === 'immediate' ? 'Immediate' : `After ${job?.joining_months} months`,
          icon: <Iconify icon="solar:clock-circle-bold" />,
        },
        {
          label: job?.is_internship ? 'Internship Duration' : 'Duration',
          value: job?.is_internship ? `${job?.duration_months} months` : 'Full Time',
          icon: <Iconify icon="solar:calendar-date-bold" />,
        },
        {
          label: 'Expected CTC',
          value: job?.expected_ctc_range,
          icon: <Iconify icon="solar:wad-of-money-bold" />,
        },
        {
          label: 'Last Date to Apply',
          value: fDate(job?.last_date),
          icon: <Iconify icon="solar:calendar-date-bold" />,
        },
        {
          label: 'Posted Date',
          value: fDate(job?.created_at),
          icon: <Iconify icon="solar:calendar-date-bold" />,
        },
        {
          label: 'Posted By',
          value: job?.posted_by_name,
          icon: <Iconify icon="solar:user-id-bold" />,
        },
        {
          label: 'Contact Email',
          value: job?.posted_by_email,
          icon: <Iconify icon="solar:letter-bold" />,
        },
      ].map((item) => (
        <Box key={item.label} sx={{ gap: 1.5, display: 'flex' }}>
          {item.icon}
          <ListItemText
            primary={item.label}
            secondary={item.value}
            slotProps={{
              primary: {
                sx: { typography: 'body2', color: 'text.secondary' },
              },
              secondary: {
                sx: { mt: 0.5, color: 'text.primary', typography: 'subtitle2' },
              },
            }}
          />
        </Box>
      ))}
    </Card>
  );

  return (
    <Grid container spacing={3} sx={sx} {...other}>
      <Grid size={{ xs: 12, md: 8 }}>{renderContent()}</Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        {renderOverview()}
      </Grid>
    </Grid>
  );
}
