import { PieceAuth } from '@activepieces/pieces-framework';

export const motiontoolsAuth = PieceAuth.SecretText({
  displayName: 'Motiontools API Key',
  description:
    'API Key for authenticating with Motiontools. Refer https://help.motiontools.io/en/articles/10476909-create-an-api-key',
  required: true,
});
