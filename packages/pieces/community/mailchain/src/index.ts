import { createPiece } from '@activepieces/pieces-framework';
import { mailchainCommon } from './lib/common/common';
import { getAuthenticatedUser } from './lib/actions/get-authenticated-user';
import { sendEmail } from './lib/actions/send-email';

export const mailchain = createPiece({
  displayName: 'Mailchain',
  description:
    'Mailchain is a simple, secure, and decentralized communications protocol that enables blockchain-based email.',
  auth: mailchainCommon.auth,
  minimumSupportedRelease: '0.20.0',
  categories: [],
  logoUrl:
    'https://imagedelivery.net/bHREz764QO9n_1kIQUR2sw/b0515bde-84c5-4514-170c-cb23adca4800/public',
  authors: ['Swanblocks/Ahmad Shawar'],
  actions: [getAuthenticatedUser, sendEmail],
  triggers: [],
});
