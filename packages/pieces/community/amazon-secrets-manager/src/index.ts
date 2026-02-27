import { createPiece } from '@activepieces/pieces-framework';
import { awsSecretsManagerAuth } from './lib/common/auth';
import { getSecretValue } from './lib/actions/get-secret-value';
import { updateSecret } from './lib/actions/update-secret';
import { createSecret } from './lib/actions/create-secret';
import { deleteSecret } from './lib/actions/delete-secret';
import { findSecret } from './lib/actions/find-secret';
import { getARandomPassword } from './lib/actions/get-a-random-password';
import { PieceCategory } from '@activepieces/shared';

export const amazonSecretsManager = createPiece({
  displayName: 'AWS Secrets Manager',
  auth: awsSecretsManagerAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-secrets-manager.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [
    createSecret,
    getSecretValue,
    updateSecret,
    deleteSecret,
    findSecret,
    getARandomPassword,
  ],
  triggers: [],
});
