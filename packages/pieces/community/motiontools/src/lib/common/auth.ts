import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const motiontoolsAuth = PieceAuth.SecretText({
  displayName: 'Motiontools API Key',
  description: 'API Key for authenticating with Motiontools',
  required: true,
});
