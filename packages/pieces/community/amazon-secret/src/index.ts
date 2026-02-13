import { createPiece } from '@activepieces/pieces-framework';
import { awsSecretsManagerAuth } from './lib/common/auth';
import { getSecretValue } from './lib/actions/get-secret-value';
import { updateSecretValue } from './lib/actions/update-secret-value';
import { createSecret } from './lib/actions/create-secret';
import { deleteSecret } from './lib/actions/delete-secret';
import { findSecret } from './lib/actions/find-secret';
import { getARandomPassword } from './lib/actions/get-a-random-password';
import { PieceCategory } from '@activepieces/shared';

export const amazonSecret = createPiece({
  displayName: 'AWS Secrets Manager',
  auth: awsSecretsManagerAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-secret.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [
    createSecret,
    getSecretValue,
    updateSecretValue,
    deleteSecret,
    findSecret,
    getARandomPassword,
  ],
  triggers: [],
});
