import { createAction, Property } from '@activepieces/pieces-framework';
import { DeleteSecretCommand } from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth, createSecretsManagerClient } from '../common/auth';
import { secretIdDropdown } from '../common/props';

export const deleteSecret = createAction({
  auth: awsSecretsManagerAuth,
  name: 'deleteSecret',
  displayName: 'Delete Secret',
  description: 'Deletes an existing secret.',
  props: {
    secretId: secretIdDropdown,
    recoveryWindowInDays: Property.Number({
      displayName: 'Recovery Window (days)',
      description:
        'The number of days before the secret is permanently deleted (7-30, default 30). Set to 0 for immediate deletion.',
      required: false,
    }),
    forceDeleteWithoutRecovery: Property.Checkbox({
      displayName: 'Force Delete Without Recovery',
      description:
        'If enabled, the secret is deleted immediately without a recovery window',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await createSecretsManagerClient(auth.props);
    const command = new DeleteSecretCommand({
      SecretId: propsValue.secretId,
      RecoveryWindowInDays: propsValue.recoveryWindowInDays,
      ForceDeleteWithoutRecovery: propsValue.forceDeleteWithoutRecovery,
    });
    return client.send(command);
  },
});
