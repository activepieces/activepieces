import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendNotification } from './lib/actions/send-notification';
import { gotifyAuth } from './lib/auth';

export const gotify = createPiece({
  displayName: 'Gotify',
  description: 'Self-hosted push notification service',

  logoUrl: 'https://cdn.activepieces.com/pieces/gotify.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["MyWay","kishanprmr","khaledmashaly","abuaboud"],
  auth: gotifyAuth,
  actions: [sendNotification],
  triggers: [],
});
