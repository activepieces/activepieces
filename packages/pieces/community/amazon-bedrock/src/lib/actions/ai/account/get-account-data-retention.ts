import { createAction } from '@activepieces/pieces-framework';
import { GetAccountDataRetentionCommand } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockGetAccountDataRetentionOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetAccountDataRetention = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_account_data_retention',
  outputSchema: amazonBedrockGetAccountDataRetentionOutputSchema,
  displayName: 'Get Account Data Retention',
  description: 'Reads the account\'s Bedrock data retention mode in the connected region.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the connected AWS account\'s Amazon Bedrock data retention mode for the connection\'s region and when it last changed. Read-only; this piece cannot change the setting.',
    idempotent: true,
  },
  props: {},
  async run({ auth, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(new GetAccountDataRetentionCommand({}));
    return bedrockAi.body(response);
  },
});
