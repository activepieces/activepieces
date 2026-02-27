import { createAction, Property } from '@activepieces/pieces-framework';
import {
  SecretsManagerClient,
  GetRandomPasswordCommand,
} from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth } from '../common/auth';

export const getARandomPassword = createAction({
  auth: awsSecretsManagerAuth,
  name: 'getARandomPassword',
  displayName: 'Generate Random Password',
  description: 'Generates a random password using AWS Secrets Manager.',
  props: {
    passwordLength: Property.Number({
      displayName: 'Password Length',
      description: 'The length of the password (default: 32)',
      required: false,
    }),
    excludeCharacters: Property.ShortText({
      displayName: 'Exclude Characters',
      description: 'Characters to exclude from the password',
      required: false,
    }),
    excludeNumbers: Property.Checkbox({
      displayName: 'Exclude Numbers',
      description: 'Exclude numbers from the password',
      required: false,
    }),
    excludePunctuation: Property.Checkbox({
      displayName: 'Exclude Punctuation',
      description: 'Exclude punctuation from the password',
      required: false,
    }),
    excludeUppercase: Property.Checkbox({
      displayName: 'Exclude Uppercase',
      description: 'Exclude uppercase letters from the password',
      required: false,
    }),
    excludeLowercase: Property.Checkbox({
      displayName: 'Exclude Lowercase',
      description: 'Exclude lowercase letters from the password',
      required: false,
    }),
    includeSpace: Property.Checkbox({
      displayName: 'Include Space',
      description: 'Include space character in the password',
      required: false,
    }),
    requireEachIncludedType: Property.Checkbox({
      displayName: 'Require Each Included Type',
      description: 'Require at least one of each included character type',
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
      const command = new GetRandomPasswordCommand({
        PasswordLength: propsValue.passwordLength,
        ExcludeCharacters: propsValue.excludeCharacters,
        ExcludeNumbers: propsValue.excludeNumbers,
        ExcludePunctuation: propsValue.excludePunctuation,
        ExcludeUppercase: propsValue.excludeUppercase,
        ExcludeLowercase: propsValue.excludeLowercase,
        IncludeSpace: propsValue.includeSpace,
        RequireEachIncludedType: propsValue.requireEachIncludedType,
      });

      const response = await client.send(command);

      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to generate random password: ${
          error.message ?? 'Unknown error'
        }`
      );
    }
  },
});
