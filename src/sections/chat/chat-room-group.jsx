import { useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import { Box, IconButton, Stack, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';

import { fData } from 'src/utils/format-number';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { CollapseButton } from './styles';
import { ChatRoomParticipantDialog } from './chat-room-participant-dialog';

// ----------------------------------------------------------------------

export function ChatRoomGroup({ participants }) {
  const collapse = useBoolean(true);
  const methods = useForm(); // Initialize react-hook-form

  const [selected, setSelected] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('Group Name');
  const [groupImage, setGroupImage] = useState('Group'); // Default group image URL

  const handleOpen = useCallback((participant) => {
    setSelected(participant);
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
  }, []);

  const handleEditDialogOpen = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
  };

  const handleSaveChanges = (data) => {
    console.log('Form Data:', data);
    console.log('Group Name:', groupName);
    console.log('Group Image:', groupImage);
    setIsEditDialogOpen(false);
  };

  const totalParticipants = participants.length;
  const menuActions = usePopover();

  const renderInfo = () => (
    <Box sx={{ position: 'relative', pb: 3, pt: 5 }}>
      <IconButton
        color={menuActions.open ? 'inherit' : 'default'}
        onClick={handleEditDialogOpen} // Open edit dialog
        sx={{ position: 'absolute', top: '10%', right: 8 }}
      >
        <Iconify icon="solar:pen-new-square-bold" />
      </IconButton>
      <Stack alignItems="center">
        <Avatar
          alt={groupName}
          src={groupImage}
          sx={{ width: 96, height: 96, mb: 2 }}
        />
        <Typography variant="subtitle1">{groupName}</Typography>
      </Stack>
    </Box>
  );

  const renderList = () => (
    <>
      {participants.map((participant) => (
        <ListItemButton key={participant.id} onClick={() => handleOpen(participant)}>
          <Badge variant={participant.status} badgeContent="">
            <Avatar alt={participant.name} src={participant.avatarUrl} />
          </Badge>

          <ListItemText
            primary={participant.name}
            secondary={participant.role}
            slotProps={{
              primary: { noWrap: true },
              secondary: { noWrap: true, sx: { typography: 'caption' } },
            }}
            sx={{ ml: 2 }}
          />
        </ListItemButton>
      ))}
    </>
  );

  return (
    <>
      {renderInfo()}
      <CollapseButton
        selected={collapse.value}
        disabled={!totalParticipants}
        onClick={collapse.onToggle}
      >
        {`In room (${totalParticipants})`}
      </CollapseButton>

      <Collapse in={collapse.value}>{renderList()}</Collapse>

      {selected && (
        <ChatRoomParticipantDialog participant={selected} open={!!selected} onClose={handleClose} />
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleEditDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Group</DialogTitle>
      <FormProvider {...methods}>
        <DialogContent>
          <Stack spacing={3}>
            <Field.UploadAvatar
              name="avatarUrl"
              maxSize={3145728}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 3,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  Allowed *.jpeg, *.jpg, *.png, *.gif
                  <br /> max size of {fData(3145728)}
                </Typography>
              }
            />
            <TextField
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={methods.handleSubmit(handleSaveChanges)} variant="contained">
            Save
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
    </>
  );
}