import { createAction, Property } from '@activepieces/pieces-framework';
import { GetFoundationModelAvailabilityCommand } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockGetFoundationModelAvailabilityOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetFoundationModelAvailability = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_foundation_model_availability',
  outputSchema: amazonBedrockGetFoundationModelAvailabilityOutputSchema,
  displayName: 'Get Foundation Model Availability',
  description: 'Checks whether the account can use a foundation model in the connected region.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reports whether the connected AWS account can invoke a foundation model in the connection\'s region: its region availability, whether the account is authorized and entitled, and whether a marketplace agreement is in place. Call it before Converse or Invoke Model when a model call fails with access denied. Takes a modelId from List Foundation Models.',
    idempotent: true,
  },
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description: 'The modelId returned by List Foundation Models, e.g. "amazon.nova-micro-v1:0".',
      required: true,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(new GetFoundationModelAvailabilityCommand({ modelId: propsValue.modelId }));
    return bedrockAi.body(response);
  },
});
