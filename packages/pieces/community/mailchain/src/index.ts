import { createPiece } from '@ensemble/pieces-framework';
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
    'https://cdn.ensemble.com/pieces/mailchain.png',
  authors: ['ahmad-swanblocks'],
  actions: [getAuthenticatedUser, sendEmail],
  triggers: [],
});