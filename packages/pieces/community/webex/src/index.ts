import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createMessage } from './lib/actions/create-message';
import { createRoom } from './lib/actions/create-room';
import { createTeam } from './lib/actions/create-team';
import { findMessage } from './lib/actions/find-message';
import { findRoom } from './lib/actions/find-room';
import { webexAuth } from './lib/common/auth';

export const webex = createPiece({
  displayName: 'Cisco Webex Meetings',
  auth: webexAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/webex.png',
  description: '',
  categories: [],
  authors: ['sanket-a11y'],
  actions: [createMessage, createRoom, createTeam, findMessage, findRoom],
  triggers: [],
});
