'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';

import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetContacts, useGetConversation, useGetConversations } from 'src/actions/chat';

import { EmptyContent } from 'src/components/empty-content';

import { useMockedUser } from 'src/auth/hooks';

import { ChatNav } from '../chat-nav';
import { ChatLayout } from '../layout';
import { ChatRoom } from '../chat-room';
import { ChatMessageList } from '../chat-message-list';
import { ChatMessageInput } from '../chat-message-input';
import { ChatHeaderDetail } from '../chat-header-detail';
import { ChatHeaderCompose } from '../chat-header-compose';
import { useCollapseNav } from '../hooks/use-collapse-nav';

// ----------------------------------------------------------------------

export function ChatView() {
  const router = useRouter();

  // ✅ **Use Supabase-authenticated user**
  const { user } = useMockedUser();
  // ✅ **Fetch contacts & conversations via Supabase**
  const { contacts } = useGetContacts();
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get('id') || '';

  const { conversations, conversationsLoading } = useGetConversations(user?.id, contacts);
  const { conversation, conversationError, conversationLoading } =
    useGetConversation(selectedConversationId);

  console.log(conversationError);
  const roomNav = useCollapseNav();
  const conversationsNav = useCollapseNav();
  const [replyTo, setReplyTo] = useState(null); // ✅ Store reply message
  const [recipients, setRecipients] = useState([]);

  // ✅ Redirect to base chat page if no conversation is selected
  useEffect(() => {
    if (!selectedConversationId) {
      startTransition(() => {
        router.push(paths.dashboard.chat);
      });
    }
  }, [conversationError, router, selectedConversationId]);

  const handleAddRecipients = useCallback(
    (selected) => {
      const isSelfSelected = selected.some((recipient) => recipient.id === user?.id);
      const isOtherSelected = selected.some((recipient) => recipient.id !== user?.id);

      if (isSelfSelected && isOtherSelected) {
        // If the user selects himself along with others, then keep only self.
        setRecipients(selected.filter((recipient) => recipient.id === user?.id));
      } else {
        setRecipients(selected);
      }
    },
    [user]
  );

  // Compute available contacts based on the current selection:
  const availableContacts = (() => {
    // If no recipients are selected, show all contacts.
    if (recipients.length === 0) return contacts;
    // If self is selected, only show self (all other people disappear).
    if (recipients.some((recipient) => recipient.id === user?.id)) {
      return contacts.filter((contact) => contact.id === user?.id);
    }
    // If any non-self is selected, filter out self.
    return contacts.filter((contact) => contact.id !== user?.id);
  })();

  // ✅ **Filter out the current user from conversation participants**
  const filteredParticipants = conversation
    ? conversation.participants.filter((participant) => participant.id !== `${user?.id}`)
    : [];
  // ✅ **Handle replying to a message**
  const handleReply = (message) => {
    const sender = filteredParticipants.find((participant) => participant.id === message.senderId);

    setReplyTo({
      id: message.id,
      body: message.body,
      senderName: message.senderId === user.id ? 'You' : sender ? sender.name : 'Unknown',
      attachments: message.attachments,
    });
  };

  const hasConversation = selectedConversationId && conversation;
  console.log(selectedConversationId);
  return (
    <DashboardContent
      maxWidth={false}
      sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}
    >
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Chat
      </Typography>

      <ChatLayout
        slots={{
          header: hasConversation ? (
            <ChatHeaderDetail
              conversationid={selectedConversationId}
              user={user}
              collapseNav={roomNav}
              participants={filteredParticipants}
              loading={conversationLoading}
            />
          ) : (
            <ChatHeaderCompose contacts={availableContacts} onAddRecipients={handleAddRecipients} />
          ),
          nav: (
            <div
              style={{
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ChatNav
                contacts={contacts}
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                collapseNav={conversationsNav}
                loading={conversationsLoading}
              />
            </div>
          ),
          main: (
            <>
              {selectedConversationId ? (
                conversationError ? (
                  <EmptyContent
                    title={
                      !navigator.onLine
                        ? 'No internet connection'
                        : conversationError.message.includes('No rows')
                          ? 'No conversation found!'
                          : conversationError.message.includes('Failed to fetch')
                            ? 'Unable to load conversation.'
                            : 'An unexpected error occurred.'
                    }
                    description={
                      !navigator.onLine
                        ? 'Please check your internet connection and try again.'
                        : conversationError.message.includes('No rows')
                          ? 'There is no conversation data available at the moment.'
                          : conversationError.message.includes('Failed to fetch')
                            ? 'The request to load conversation data failed. Verify your network and retry.'
                            : ''
                    }
                    imgUrl={`${CONFIG.assetsDir}/assets/icons/empty/ic-chat-empty.svg`}
                  />
                ) : (
                  <ChatMessageList
                    userId={user?.id}
                    conversationId={selectedConversationId}
                    messages={conversation?.messages ?? []}
                    participants={filteredParticipants}
                    loading={conversationLoading}
                    onReply={handleReply}
                  />
                )
              ) : (
                <EmptyContent
                  title="Good morning!"
                  description="Write something awesome..."
                  imgUrl={`${CONFIG.assetsDir}/assets/icons/empty/ic-chat-active.svg`}
                />
              )}
              <ChatMessageInput
                recipients={recipients}
                onAddRecipients={handleAddRecipients}
                selectedConversationId={selectedConversationId}
                disabled={!recipients.length && !selectedConversationId}
                replyTo={replyTo} // ✅ Keep reply functionality
                setReplyTo={setReplyTo} // ✅ Allow clearing reply
              />
            </>
          ),
          details: hasConversation && (
            <ChatRoom
              collapseNav={roomNav}
              participants={filteredParticipants}
              loading={conversationLoading}
              messages={conversation?.messages ?? []}
              conversationId={selectedConversationId}
            />
          ),
        }}
      />
    </DashboardContent>
  );
}
