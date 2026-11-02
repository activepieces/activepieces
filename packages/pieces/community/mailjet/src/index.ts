import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { mailjetAiActions } from './lib/actions/ai';
import { sendEmailAction } from './lib/actions/send-email';
import { mailjetAuth } from './lib/auth';
import { mailjetClient } from './lib/common/client';

export const mailjet = createPiece({
  displayName: 'Mailjet',
  description: 'Email delivery service for sending transactional and marketing emails',
  auth: mailjetAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailjet.svg',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['christian-schab'],
  actions: [
    sendEmailAction,
    ...mailjetAiActions,
    createCustomApiCallAction({
      auth: mailjetAuth,
      baseUrl: () => mailjetClient.baseUrl(),
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
      }),
    }),
  ],
  triggers: []
});
