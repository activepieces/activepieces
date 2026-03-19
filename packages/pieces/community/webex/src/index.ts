import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { createMessage } from './lib/actions/create-message';
import { createRoom } from './lib/actions/create-room';
import { createTeam } from './lib/actions/create-team';
import { findMessage } from './lib/actions/find-message';
import { findRoom } from './lib/actions/find-room';
import { webexAuth } from './lib/common/auth';
import { newRoom } from './lib/triggers/new-room';
import { newMeeting } from './lib/triggers/new-meeting';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';

export const webex = createPiece({
  displayName: 'Cisco Webex Meetings',
  auth: webexAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/webex.png',
  description: '',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['sanket-a11y'],
  actions: [
    createMessage,
    createRoom,
    createTeam,
    findMessage,
    findRoom,
    createCustomApiCallAction({
      auth: webexAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newRoom, newMeeting],
});
