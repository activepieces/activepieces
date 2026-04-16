import { createAction, Property } from '@activepieces/pieces-framework';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth, createSecretsManagerClient } from '../common/auth';
import { secretIdDropdown } from '../common/props';

export const getSecretValue = createAction({
  auth: awsSecretsManagerAuth,
  name: 'getSecretValue',
  displayName: 'Get Secret Value',
  description: 'Retrieves a secret value.',
  props: {
    secretId: secretIdDropdown,
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description: 'The unique identifier of the version (optional)',
      required: false,
    }),
    versionStage: Property.ShortText({
      displayName: 'Version Stage',
      description: 'The staging label to retrieve (defaults to AWSCURRENT)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await createSecretsManagerClient(auth.props);
    const command = new GetSecretValueCommand({
      SecretId: propsValue.secretId,
      VersionId: propsValue.versionId,
      VersionStage: propsValue.versionStage,
    });
    return client.send(command);
  },
});
