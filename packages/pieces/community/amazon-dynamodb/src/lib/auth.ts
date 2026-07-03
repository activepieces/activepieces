import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { createDynamoDBClient } from './common';

export const dynamodbAuth = PieceAuth.CustomAuth({
  description: 'AWS IAM credentials for DynamoDB.',
  required: true,
  props: {
    accessKeyId: PieceAuth.SecretText({
      displayName: 'Access Key ID',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      required: true,
    }),
    sessionToken: PieceAuth.SecretText({
      displayName: 'Session Token',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region',
      description: 'AWS region, for example us-east-1.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = createDynamoDBClient(auth);
      await client.send(new ListTablesCommand({ Limit: 1 }));
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
