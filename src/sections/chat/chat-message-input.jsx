import EmojiPicker from 'emoji-picker-react'; // ✅ New Emoji Picker
import { uuidv4 } from 'minimal-shared/utils';
import { useRef, useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import { Stack, useTheme } from '@mui/material';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { today } from 'src/utils/format-time';
import { fDateTime } from 'src/utils/format-time';

import { sendMessage, createConversation } from 'src/actions/chat';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { FileThumbnail, formatFileSize } from 'src/components/file-thumbnail';

import { useMockedUser } from 'src/auth/hooks';

import { initialConversation } from './utils/initial-conversation';

// ----------------------------------------------------------------------

export function ChatMessageInput({
  disabled,
  recipients,
  onAddRecipients,
  selectedConversationId,
  replyTo, // ✅ Accept replyTo message
  setReplyTo, // ✅ Accept function to clear reply
}) {
  const router = useRouter();

  const { user } = useMockedUser();

  const fileImageRef = useRef(null); // ✅ Reference for images
  const fileDocRef = useRef(null); // ✅ Reference for non-image files

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]); // ✅ Store multiple attachments

  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // ✅ Track emoji picker visibility
  const handleEmojiSelect = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji); // ✅ Insert emoji into input
    setShowEmojiPicker(false); // ✅ Close picker after selection
  };

  const themes = useTheme();
  const pickerTheme = themes.palette.mode === 'dark' ? 'dark' : 'light';
  const myContact = useMemo(
    () => ({
      id: `${user?.id}`,
      role: `${user.user_metadata?.role}`,
      email: `${user.user_metadata?.email}`,
      address: `${user.user_metadata?.address}`,
      name: `${user.user_metadata?.first_name} ${user.user_metadata?.last_name}`,
      lastActivity: today(),
      avatarUrl: `${user.user_metadata?.avatar_url}`,
      phoneNumber: `${user.user_metadata?.phone_number}`,
      status: 'online',
    }),
    [user]
  );

  const { messageData, conversationData } = initialConversation({
    message,
    recipients,
    me: myContact,
    attachments,
  });

  const handleAttachImages = () => {
    if (fileImageRef.current) {
      fileImageRef.current.click();
    }
  };

  const handleAttachFiles = () => {
    if (fileDocRef.current) {
      fileDocRef.current.click();
    }
  };

  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  const handleFileChange = useCallback((event) => {
    const files = Array.from(event.target.files);
    const newAttachments = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newAttachments.push({
          id: uuidv4(),
          name: file.name,
          path: e.target.result,
          preview: e.target.result,
          size: file.size,
          createdAt: new Date().toISOString(),
          type: file.type,
        });

        if (newAttachments.length === files.length) {
          // ✅ Ensures all attachments are added before updating state
          setAttachments((prev) => [...prev, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleSendMessage = useCallback(
    async (event) => {
      if (event.key !== 'Enter' && event.type !== 'click') return;
      console.log(message);
      try {
        let finalMessageData = { ...messageData, body: message };

        if (attachments.length > 0) {
          finalMessageData = {
            ...finalMessageData, // ✅ Preserve existing data
            attachments: [...attachments], // ✅ Ensure attachments are included
            contentType: attachments.some((att) => att.type.includes('image')) ? 'image' : 'file',
          };
        }

        if (replyTo) {
          finalMessageData.parent_id = replyTo.id;
        }

        console.log('Sending message:', finalMessageData); // ✅ Debug before sending
        if (message !== '' || attachments.length > 0) {
          if (selectedConversationId) {
            await sendMessage(
              selectedConversationId,
              user?.id,
              finalMessageData.body,
              replyTo?.id || null,
              finalMessageData.attachments
            );
          } else {
            console.log(conversationData);
            const res = await createConversation(conversationData, user?.id);
            router.push(`${paths.dashboard.chat}?id=${res.id}`);
            onAddRecipients([]);
          }
        }

        setMessage('');
        setAttachments([]); // ✅ Clear attachments only after sending
        setReplyTo(null); // ✅ Clear reply after sending
      } catch (error) {
        console.error(error);
      }
    },
    [
      message,
      attachments,
      replyTo, // ✅ Include replyTo in dependencies to avoid stale state
      setReplyTo, // ✅ Ensure the function updates state correctly
      selectedConversationId,
      user?.id,
      conversationData,
      router,
      onAddRecipients,
    ]
  );

  return (
    <>
      {/* ✅ Small preview inside input like WhatsApp */}
      {replyTo && (
        <Box
          sx={{
            p: 1,
            m: 1,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 1,
            bgcolor: 'background.neutral',
            justifyContent: 'space-between',
            borderLeft: '3px solid',
            borderColor: 'primary.main',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="caption" color="text.secondary" marginBottom={1}>
              Replying to {replyTo.senderName}:
            </Typography>

            {/* ✅ Show body if available, otherwise show attachment preview */}
            {replyTo.body ? (
              <Typography variant="body2" noWrap>
                {replyTo.body}
              </Typography>
            ) : replyTo.attachments && replyTo.attachments.length > 0 ? (
              <>
                {/* ✅ If first attachment is an image, show it */}
                {['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'svg+xml'].includes(
                  replyTo.attachments[0].type
                ) ? (
                  <img
                    src={replyTo.attachments[0].path}
                    alt="Attachment Preview"
                    style={{ width: 70, height: 70, borderRadius: 5, objectFit: 'cover' }}
                  />
                ) : (
                  // ✅ Show file icon for non-image files
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FileThumbnail
                      imageView
                      file={replyTo.attachments[0].path}
                      slotProps={{ icon: { sx: { width: 24, height: 24 } } }}
                      sx={{ width: 40, height: 40, bgcolor: 'background.neutral' }}
                    />
                    <Typography variant="body2" noWrap>
                      {replyTo.attachments[0].name}
                    </Typography>
                  </Stack>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                [No Content]
              </Typography>
            )}
          </Box>

          {/* Close Reply Button */}
          <IconButton size="small" onClick={() => setReplyTo(null)}>
            <Iconify icon="mingcute:close-line" width={16} />
          </IconButton>
        </Box>
      )}

      {attachments.length > 0 && (
        <Scrollbar
          sx={{
            maxHeight: 200,
            minHeight: attachments.some((file) =>
              ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'svg+xml'].includes(
                file.type.split('/')[1]
              )
            )
              ? 120
              : 70,
            overflowY: 'auto',
            transition: 'min-height .3s ease-in-out', // ✅ Smooth transition on shrink
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              p: 1,
              borderRadius: 1,
              maxHeight: '100%',
              overflowY: 'auto',
            }}
          >
            {attachments.map((file) => {
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'svg+xml'].includes(
                file.type.split('/')[1]
              );

              return (
                <Stack key={file.id} sx={{ position: 'relative', alignItems: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 1,
                      maxWidth: 180,
                      borderRadius: 2,
                    }}
                  >
                    {isImage && (
                      <IconButton
                        onClick={() =>
                          setAttachments((prev) => prev.filter((item) => item.id !== file.id))
                        }
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: 30,
                          height: 30,
                          color: 'white',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                        }}
                      >
                        <Iconify icon="mingcute:close-line" width={18} />
                      </IconButton>
                    )}
                    {isImage ? (
                      <img
                        src={file.preview}
                        alt="Preview"
                        style={{ width: 110, height: 100, borderRadius: 5 }}
                      />
                    ) : null}
                  </Box>
                  {!isImage && (
                    <Box
                      sx={{
                        boxShadow: 1,
                        p: 0.5,
                        borderRadius: 2,
                        maxWidth: 200,
                        gap: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <FileThumbnail
                        imageView
                        file={file.type.split('/')[1]}
                        onRemove={() =>
                          setAttachments((prev) => prev.filter((item) => item.id !== file.id))
                        }
                        slotProps={{ icon: { sx: { width: 24, height: 24 } } }}
                        sx={{ width: 40, height: 40, bgcolor: 'background.neutral' }}
                      />
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                        slotProps={{
                          primary: { noWrap: true, sx: { typography: 'body2' } },
                          secondary: {
                            noWrap: true,
                            sx: {
                              mt: 0.25,
                              typography: 'caption',
                              color: 'text.disabled',
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              );
            })}
          </Box>
        </Scrollbar>
      )}

      <InputBase
        name="chat-message"
        id="chat-message-input"
        value={message}
        maxRows={5}
        multiline
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
          }
        }}
        onChange={handleChangeMessage}
        placeholder="Type a message"
        disabled={disabled}
        startAdornment={
          <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Iconify icon="eva:smiling-face-fill" />
          </IconButton>
        }
        endAdornment={
          <Box sx={{ flexShrink: 0, display: 'flex' }}>
            <IconButton onClick={handleSendMessage}>
              <Iconify icon="solar:plain-bold" />
            </IconButton>
            <IconButton onClick={handleAttachImages}>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>
            <IconButton onClick={handleAttachFiles}>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>
            <IconButton>
              <Iconify icon="solar:microphone-bold" />
            </IconButton>
          </Box>
        }
        sx={[
          (theme) => ({
            px: 1,
            maxheight: 200,
            minHeight: 56,
            flexShrink: 0,
            borderTop: `solid 1px ${theme.vars.palette.divider}`,
            overflowY: 'auto',
            /* Custom scrollbar: only thumb visible */
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.vars.palette.text.disabled,
              borderRadius: 3,
            },
            /* Firefox */
            scrollbarWidth: 'thin',
            scrollbarColor: `${theme.vars.palette.text.disabled} transparent`,
          }),
        ]}
      />
      {showEmojiPicker && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 99,
            borderRadius: 2,
            boxShadow: 3,
            bottom: 60,
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            emojiStyle="native"
            previewConfig={{ showPreview: false }}
            height={300}
            theme={pickerTheme}
          />
        </Box>
      )}
      <input
        type="file"
        ref={fileImageRef}
        style={{ display: 'none' }}
        multiple // ✅ Allow multiple file selection
        accept="image/*" // ✅ Only allows images
        onChange={handleFileChange}
      />

      {/* ✅ Hidden Input for Documents (Non-Images) */}
      <input
        type="file"
        ref={fileDocRef}
        multiple // ✅ Allow multiple file selection
        style={{ display: 'none' }}
        accept=".pdf,.docx,.xlsx,.zip,.txt" // ✅ Only allows documents
        onChange={handleFileChange}
      />
    </>
  );
}
