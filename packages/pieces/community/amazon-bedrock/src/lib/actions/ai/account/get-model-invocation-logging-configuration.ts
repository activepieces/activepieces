import { createAction } from '@activepieces/pieces-framework';
import { GetModelInvocationLoggingConfigurationCommand } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockGetModelInvocationLoggingConfigurationOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetModelInvocationLoggingConfiguration = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_model_invocation_logging_configuration',
  outputSchema: amazonBedrockGetModelInvocationLoggingConfigurationOutputSchema,
  displayName: 'Get Model Invocation Logging Configuration',
  description: 'Reads where the account logs model invocations in the connected region.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the connected AWS account\'s Amazon Bedrock model invocation logging settings for the connection\'s region: whether prompts and responses are logged, to which CloudWatch log group or S3 bucket, and which data types (text, image, embedding, video). loggingConfig is absent when logging is off. Read-only; this piece cannot change the setting.',
    idempotent: true,
  },
  props: {},
  async run({ auth, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(new GetModelInvocationLoggingConfigurationCommand({}));
    return { loggingConfig: response.loggingConfig ?? null };
  },
});
