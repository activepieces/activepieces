import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';

export const sendinblueAuth = PieceAuth.SecretText({
  displayName: 'Project API key',
  description: 'Your project API key',
  required: true,
});

export const sendinblue = createPiece({
  displayName: 'Brevo',
  description: 'sendinblue',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/brevo.png',
  authors: ['kanarelo'],
  auth: sendinblueAuth,
  actions: [createOrUpdateContact],
  triggers: [],
});
