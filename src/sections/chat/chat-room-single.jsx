import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import { Button, MenuItem } from '@mui/material';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import { CollapseButton } from './styles';

// ----------------------------------------------------------------------

export function ChatRoomSingle({ participant }) {
  const collapse = useBoolean(true);

  const router = useRouter();

  const renderInfo = () => (
    <Stack alignItems="center" sx={{ pb: 3, pt: 5 }}>
      <Avatar
        alt={participant?.name}
        src={participant?.avatarUrl}
        sx={{ width: 96, height: 96, mb: 2 }}
      />
      <Typography variant="subtitle1">{participant?.name}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
        {participant?.role}
      </Typography>
      <Button variant="soft" color="primary"
        startIcon={<Iconify width={24} icon="solar:user-id-bold" />}
        onClick={() => router.push(paths.dashboard.user.cards)}>
        View Profile
      </Button>
    </Stack>
  );

  const renderContact = () => (
    <Stack spacing={2} sx={{ px: 2, py: 2.5 }}>
      {[
        { icon: 'solar:phone-bold', value: participant?.phoneNumber },
        { icon: 'fluent:mail-24-filled', value: participant?.email },
      ].map((item) => (
        <Box
          key={item.icon}
          sx={{
            gap: 1,
            display: 'flex',
            typography: 'body2',
            wordBreak: 'break-all',
          }}
        >
          <Iconify icon={item.icon} sx={{ flexShrink: 0, color: 'text.disabled' }} />
          {item.value}
        </Box>
      ))}
    </Stack>
  );

  return (
    <>
      {renderInfo()}

      <CollapseButton selected={collapse.value} onClick={collapse.onToggle}>
        Information
      </CollapseButton>

      <Collapse in={collapse.value}>{renderContact()}</Collapse>
    </>
  );
}
