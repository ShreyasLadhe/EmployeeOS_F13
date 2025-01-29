import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { supabase } from 'src/lib/supabase';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

export function JobItem({ job, editHref, detailsHref, onDelete, sx, ...other }) {
  const { user } = useAuthContext();
  const [applicationCount, setApplicationCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchApplicationCount = async () => {
      try {
        const { data, error, count } = await supabase
          .from('applications')
          .select('*', { count: 'exact' })
          .eq('job_id', job.id);

        if (error) {
          console.error('Error fetching application count:', error.message);
          console.error('Details:', { error, jobId: job.id });
          return;
        }

        if (count === null) {
          console.warn('No count returned from query:', { data, jobId: job.id });
        }

        setApplicationCount(count || 0);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    if (job.id) {
      fetchApplicationCount();
    }
  }, [job.id]);

  const handleOpenMenu = (event) => {
    setMenuOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuOpen(null);
  };

  const handleCopyLink = () => {
    const applicationLink = `${window.location.origin}${paths.public.jobApplication(job.id)}`;
    navigator.clipboard.writeText(applicationLink);
    toast.success('Application link copied to clipboard!');
  };

  const renderMenu = (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton onClick={handleOpenMenu}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>
    </Stack>
  );

  const renderMenuItems = (
    <CustomPopover
      open={Boolean(menuOpen)}
      anchorEl={menuOpen}
      onClose={handleCloseMenu}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: { sx: { width: 160 } },
        arrow: { placement: 'right-top' }
      }}
    >
      <MenuItem component={RouterLink} href={detailsHref} onClick={handleCloseMenu}>
        <Iconify icon="solar:eye-bold" />
        View
      </MenuItem>

      <MenuItem component={RouterLink} href={editHref} onClick={handleCloseMenu}>
        <Iconify icon="solar:pen-bold" />
        Edit
      </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
    </CustomPopover>
  );

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', ...sx }} {...other}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 3, px: 3 }}>
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 0.5,
            bgcolor: 'success.lighter',
            color: 'success.darker',
          }}
        >
          {job.is_active ? 'Active' : 'Inactive'}
        </Box>

        {renderMenu}
      </Stack>

      {renderMenuItems}

      <Box sx={{ p: 3, pb: 2 }}>
        <Stack sx={{ mb: 2 }}>
          <Typography variant="subtitle1" component="div" noWrap>
            <Link component={RouterLink} href={detailsHref} color="inherit">
              {job.title}
            </Link>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {job.department}
          </Typography>
        </Stack>

        <ListItemText
          secondary={`Posted date: ${fDate(job.created_at)}`}
          slotProps={{
            secondary: {
              sx: { mt: 1, typography: 'caption', color: 'text.disabled' },
            },
          }}
        />

        <Stack spacing={1} direction="row" alignItems="center">
          <Box
            sx={{
              gap: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
              typography: 'caption',
            }}
          >
            <Iconify width={16} icon="solar:users-group-rounded-bold" />
            {job.positions} position{job.positions > 1 ? 's' : ''}
          </Box>

          <Box
            sx={{
              gap: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'info.main',
              typography: 'caption',
            }}
          >
            <Iconify width={16} icon="solar:file-text-bold" />
            {applicationCount} application{applicationCount !== 1 ? 's' : ''}
          </Box>
        </Stack>

        {isAdmin && (
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Box
              sx={{
                gap: 0.5,
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                typography: 'caption',
              }}
            >
              <Iconify width={16} icon="solar:user-id-bold" />
              Posted by: {job.posted_by_name}
            </Box>
            <Box
              sx={{
                gap: 0.5,
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                typography: 'caption',
              }}
            >
              <Iconify width={16} icon="solar:letter-bold" />
              {job.posted_by_email}
            </Box>
          </Stack>
        )}
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        sx={{
          p: 3,
          gap: 1.5,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
        }}
      >
        {[
          {
            label: job.is_internship ? 'Internship' : 'Full Time',
            icon: <Iconify width={16} icon="carbon:skill-level-basic" sx={{ flexShrink: 0 }} />,
          },
          {
            label: job.joining_type === 'immediate' ? 'Immediate' : `After ${job.joining_months} months`,
            icon: <Iconify width={16} icon="solar:clock-circle-bold" sx={{ flexShrink: 0 }} />,
          },
          {
            label: job.expected_ctc_range,
            icon: <Iconify width={16} icon="solar:wad-of-money-bold" sx={{ flexShrink: 0 }} />,
          },
          {
            label: job.location,
            icon: <Iconify width={16} icon="solar:map-point-bold" sx={{ flexShrink: 0 }} />,
          },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              gap: 0.5,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              color: 'text.disabled',
            }}
          >
            {item.icon}
            <Typography variant="caption" noWrap>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

JobItem.propTypes = {
  job: PropTypes.object,
  onDelete: PropTypes.func,
  editHref: PropTypes.string,
  detailsHref: PropTypes.string,
  sx: PropTypes.object,
};
