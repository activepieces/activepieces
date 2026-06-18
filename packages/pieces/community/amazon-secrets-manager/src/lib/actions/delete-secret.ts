import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SecretsManagerClient,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth } from '../common/auth';
import { secretIdDropdown } from '../common/props';

export const deleteSecret = createAction({
  auth: awsSecretsManagerAuth,
  name: 'deleteSecret',
  displayName: 'Delete Secret',
  description: 'Deletes an existing secret.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes an existing AWS Secrets Manager secret (identified by name or ARN, selectable from a list or passed directly). By default schedules deletion after a recovery window (7-30 days, default 30) during which it can be restored; enabling force-delete removes it immediately and irreversibly. Use to decommission a credential. Destructive and not idempotent — a repeat call on an already-deleted secret errors.',
    idempotent: false,
  },
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
    const client = new SecretsManagerClient({
      region: auth.props.region,
      credentials: {
        accessKeyId: auth.props.accessKeyId,
        secretAccessKey: auth.props.secretAccessKey,
      },
    });

    try {
      const command = new DeleteSecretCommand({
        SecretId: propsValue.secretId,
        RecoveryWindowInDays: propsValue.recoveryWindowInDays,
        ForceDeleteWithoutRecovery: propsValue.forceDeleteWithoutRecovery,
      });

      const response = await client.send(command);

      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to delete secret: ${error.message ?? 'Unknown error'}`
      );
    }
  },
});
