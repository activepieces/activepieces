import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { heartbeatAuth } from './lib/auth';
import { HEARTBEAT_BASE_URL, heartbeatApi } from './lib/common/client';
import { heartBeatCreateUser } from './lib/actions/create-user';
import { createMemberAction } from './lib/actions/ai/create-member';
import { listUsersAction } from './lib/actions/list-users';
import { getUserAction } from './lib/actions/get-user';
import { findUserByEmailAction } from './lib/actions/find-user-by-email';
import { updateUserAction } from './lib/actions/update-user';
import { removeUserAction } from './lib/actions/remove-user';
import { reactivateUserAction } from './lib/actions/reactivate-user';
import { createPendingUserAction } from './lib/actions/create-pending-user';
import { listUserCompletedLessonsAction } from './lib/actions/list-user-completed-lessons';
import { markLessonsCompletedAction } from './lib/actions/mark-lessons-completed';
import { listRolesAction } from './lib/actions/list-roles';
import { listGroupsAction } from './lib/actions/list-groups';
import { getGroupAction } from './lib/actions/get-group';
import { createGroupAction } from './lib/actions/create-group';
import { updateGroupAction } from './lib/actions/update-group';
import { deleteGroupAction } from './lib/actions/delete-group';
import { addUsersToGroupAction } from './lib/actions/add-users-to-group';
import { removeUsersFromGroupAction } from './lib/actions/remove-users-from-group';
import { listChannelsAction } from './lib/actions/list-channels';
import { listChannelCategoriesAction } from './lib/actions/list-channel-categories';
import { createChannelCategoryAction } from './lib/actions/create-channel-category';
import { createChannelAction } from './lib/actions/create-channel';
import { updateChannelAction } from './lib/actions/update-channel';
import { deleteChannelAction } from './lib/actions/delete-channel';
import { listChannelThreadsAction } from './lib/actions/list-channel-threads';
import { getThreadAction } from './lib/actions/get-thread';
import { createThreadAction } from './lib/actions/create-thread';
import { createCommentAction } from './lib/actions/create-comment';
import { sendChatMessageAction } from './lib/actions/send-chat-message';
import { listChatMessagesAction } from './lib/actions/list-chat-messages';
import { sendDirectMessageAction } from './lib/actions/send-direct-message';
import { getOrCreateDirectChatAction } from './lib/actions/get-or-create-direct-chat';
import { listDirectMessagesAction } from './lib/actions/list-direct-messages';
import { listEventsAction } from './lib/actions/list-events';
import { getEventAction } from './lib/actions/get-event';
import { getEventAttendanceAction } from './lib/actions/get-event-attendance';
import { createEventAction } from './lib/actions/create-event';
import { listInvitationsAction } from './lib/actions/list-invitations';
import { createInvitationLinkAction } from './lib/actions/create-invitation-link';
import { addEmailsToInvitationAction } from './lib/actions/add-emails-to-invitation';
import { listCoursesAction } from './lib/actions/list-courses';
import { getLessonAction } from './lib/actions/get-lesson';
import { listDocumentsAction } from './lib/actions/list-documents';
import { getDocumentAction } from './lib/actions/get-document';
import { newMemberTrigger } from './lib/triggers/new-member';
import { newThreadTrigger } from './lib/triggers/new-thread';
import { newMentionTrigger } from './lib/triggers/new-mention';
import { newEventTrigger } from './lib/triggers/new-event';
import { newDirectMessageTrigger } from './lib/triggers/new-direct-message';

export { heartbeatAuth } from './lib/auth';

export const Heartbeat = createPiece({
  displayName: 'Heartbeat',
  description: 'Community platform for members, groups, channels, threads, events and courses',
  auth: heartbeatAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/heartbeat.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['kanarelo', 'kishanprmr', 'abuaboud'],
  actions: [
    heartBeatCreateUser,
    createMemberAction,
    listUsersAction,
    getUserAction,
    findUserByEmailAction,
    updateUserAction,
    removeUserAction,
    reactivateUserAction,
    createPendingUserAction,
    listUserCompletedLessonsAction,
    markLessonsCompletedAction,
    listRolesAction,
    listGroupsAction,
    getGroupAction,
    createGroupAction,
    updateGroupAction,
    deleteGroupAction,
    addUsersToGroupAction,
    removeUsersFromGroupAction,
    listChannelsAction,
    listChannelCategoriesAction,
    createChannelCategoryAction,
    createChannelAction,
    updateChannelAction,
    deleteChannelAction,
    listChannelThreadsAction,
    getThreadAction,
    createThreadAction,
    createCommentAction,
    sendChatMessageAction,
    listChatMessagesAction,
    sendDirectMessageAction,
    getOrCreateDirectChatAction,
    listDirectMessagesAction,
    listEventsAction,
    getEventAction,
    getEventAttendanceAction,
    createEventAction,
    listInvitationsAction,
    createInvitationLinkAction,
    addEmailsToInvitationAction,
    listCoursesAction,
    getLessonAction,
    listDocumentsAction,
    getDocumentAction,
    createCustomApiCallAction({
      auth: heartbeatAuth,
      baseUrl: () => HEARTBEAT_BASE_URL,
      authMapping: async (auth) => heartbeatApi.authHeaders(auth.secret_text),
    }),
  ],
  triggers: [newMemberTrigger, newThreadTrigger, newMentionTrigger, newEventTrigger, newDirectMessageTrigger],
});
