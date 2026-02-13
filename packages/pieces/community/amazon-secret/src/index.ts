import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { awsSecretsManagerAuth } from './lib/common/auth';
import { getSecretValue } from './lib/actions/get-secret-value';
import { updateSecretValue } from './lib/actions/update-secret-value';
import { createSecret } from './lib/actions/create-secret';

export const amazonSecret = createPiece({
  displayName: 'Amazon Secrets Manager',
  auth: awsSecretsManagerAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-secret.png',
  authors: ['sanket-a11y'],
  actions: [createSecret, getSecretValue, updateSecretValue],
  triggers: [],
});
