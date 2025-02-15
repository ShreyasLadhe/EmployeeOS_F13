import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { fToNow } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { useMockedUser } from 'src/auth/hooks';

import { getMessage } from './utils/get-message';

// ----------------------------------------------------------------------

export function ChatMessageItem({ message, participants, onOpenLightbox }) {
  const { user } = useMockedUser();

  const { me, senderDetails } = getMessage({
    message,
    participants,
    currentUserId: `${user?.id}`,
  });

  const { firstName, avatarUrl } = senderDetails;
  const { body, createdAt } = message;

  // ✅ Detect if message contains an image
  const isImage = body.startsWith('data:image/');
  // ✅ Detect if message contains a file (PDF, ZIP, DOC, etc.)
  const isFile = body.startsWith('data:application/');
  // ✅ Detect if it's a folder (Assuming folder messages include '[FOLDER]')
  const isFolder = body.includes('[FOLDER]');

  const renderInfo = () => (
    <Typography
      noWrap
      variant="caption"
      sx={{ mb: 1, color: 'text.disabled', ...(!me && { mr: 'auto' }) }}
    >
      {!me && `${firstName}, `}
      {fToNow(createdAt)}
    </Typography>
  );

  const renderBody = () => (
    <Stack
      sx={{
        p: 1.5,
        minWidth: 48,
        maxWidth: 320,
        borderRadius: 1,
        typography: 'body2',
        bgcolor: 'background.neutral',
        ...(me && { color: 'grey.800', bgcolor: 'primary.lighter' }),
        ...(isImage && { p: 0, bgcolor: 'transparent' }),
      }}
    >
      {/* ✅ Show image preview */}
      {isImage ? (
        <Box
          component="img"
          alt="Attachment"
          src={body}
          onClick={() => onOpenLightbox(body)}
          sx={{
            width: 400,
            height: 'auto',
            borderRadius: 1.5,
            cursor: 'pointer',
            objectFit: 'cover',
            aspectRatio: '16/11',
            '&:hover': { opacity: 0.9 },
          }}
        />
      ) : isFile ? (
        // ✅ Show file preview with download option
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InsertDriveFileIcon sx={{ mr: 1 }} />
          <a
            href={body}
            download={`file_${message.message_id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Download File
          </a>
        </Box>
      ) : isFolder ? (
        // ✅ Show folder icon if it’s a folder
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FolderIcon sx={{ mr: 1, color: 'blue' }} />
          <Typography>Folder</Typography>
        </Box>
      ) : (
        // ✅ Default Text Messages
        body
      )}
    </Stack>
  );

  const renderActions = () => (
    <Box
      className="message-actions"
      sx={(theme) => ({
        pt: 0.5,
        left: 0,
        opacity: 0,
        top: '100%',
        display: 'flex',
        position: 'absolute',
        transition: theme.transitions.create(['opacity'], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(me && { right: 0, left: 'unset' }),
      })}
    >
      <IconButton size="small">
        <Iconify icon="solar:reply-bold" width={16} />
      </IconButton>

      <IconButton size="small">
        <Iconify icon="eva:smiling-face-fill" width={16} />
      </IconButton>

      <IconButton size="small">
        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
      </IconButton>
    </Box>
  );

  if (!message.body) {
    return null;
  }

  return (
    <Box sx={{ mb: 5, display: 'flex', justifyContent: me ? 'flex-end' : 'unset' }}>
      {!me && <Avatar alt={firstName} src={avatarUrl} sx={{ width: 32, height: 32, mr: 2 }} />}

      <Stack alignItems={me ? 'flex-end' : 'flex-start'}>
        {renderInfo()}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            '&:hover': { '& .message-actions': { opacity: 1 } },
          }}
        >
          {renderBody()}
          {renderActions()}
        </Box>
      </Stack>
    </Box>
  );
}
