import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';
import { banUser } from './lib/actions/ai/ban-user';
import { createRoom } from './lib/actions/ai/create-room';
import { editMessage } from './lib/actions/ai/edit-message';
import { getCurrentUser } from './lib/actions/ai/get-current-user';
import { getMessage } from './lib/actions/ai/get-message';
import { getRoom } from './lib/actions/ai/get-room';
import { getUserProfile } from './lib/actions/ai/get-user-profile';
import { inviteUser } from './lib/actions/ai/invite-user';
import { joinRoom } from './lib/actions/ai/join-room';
import { kickUser } from './lib/actions/ai/kick-user';
import { leaveRoom } from './lib/actions/ai/leave-room';
import { listJoinedRooms } from './lib/actions/ai/list-joined-rooms';
import { listMessages } from './lib/actions/ai/list-messages';
import { listRoomMembers } from './lib/actions/ai/list-room-members';
import { reactToMessage } from './lib/actions/ai/react-to-message';
import { redactMessage } from './lib/actions/ai/redact-message';
import { searchPublicRooms } from './lib/actions/ai/search-public-rooms';
import { searchUsers } from './lib/actions/ai/search-users';
import { sendTextMessage } from './lib/actions/ai/send-text-message';
import { setRoomName } from './lib/actions/ai/set-room-name';
import { setRoomTopic } from './lib/actions/ai/set-room-topic';
import { unbanUser } from './lib/actions/ai/unban-user';
import { matrixAuth } from './lib/auth';
import { matrixClient } from './lib/common/client';

export const matrix = createPiece({
  displayName: 'Matrix',
  description: 'Open standard for interoperable, decentralized, real-time communication',
  logoUrl: 'https://cdn.activepieces.com/pieces/matrix.png',
  categories: [PieceCategory.COMMUNICATION],
  minimumSupportedRelease: '0.88.2',
  authors: ['MyWay', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  auth: matrixAuth,
  actions: [
    sendMessage,
    banUser,
    createRoom,
    editMessage,
    getCurrentUser,
    getMessage,
    getRoom,
    getUserProfile,
    inviteUser,
    joinRoom,
    kickUser,
    leaveRoom,
    listJoinedRooms,
    listMessages,
    listRoomMembers,
    reactToMessage,
    redactMessage,
    searchPublicRooms,
    searchUsers,
    sendTextMessage,
    setRoomName,
    setRoomTopic,
    unbanUser,
    createCustomApiCallAction({
      auth: matrixAuth,
      baseUrl: (auth) => (auth ? matrixClient.normalizeHomeserver(auth.props.base_url) : ''),
      authMapping: async (auth, propsValue) => {
        const baseUrl = matrixClient.normalizeHomeserver(auth.props.base_url);
        const urlProp = propsValue['url'];
        const url = matrixClient.isRecord(urlProp) && typeof urlProp['url'] === 'string' ? urlProp['url'].trim() : '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
          if (!matrixClient.isSameOrigin({ url, baseUrl })) {
            throw new Error('The URL must be on the Home Server of the connection.');
          }
        }
        if (url.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
          throw new Error('The URL must not contain ".." segments.');
        }
        return { Authorization: `Bearer ${matrixClient.accessTokenOf(auth.props)}` };
      },
    }),
  ],
  triggers: [],
});

export { matrixAuth };
