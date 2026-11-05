import { createAction, Property } from '@activepieces/pieces-framework';
import { GetFoundationModelCommand } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockGetFoundationModelOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetFoundationModel = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_foundation_model',
  outputSchema: amazonBedrockGetFoundationModelOutputSchema,
  displayName: 'Get Foundation Model',
  description: 'Gets the details of one foundation model.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Amazon Bedrock foundation model by its modelId or ARN from List Foundation Models: provider, input and output modalities, supported inference and customization types, streaming support and lifecycle status. Use Get Foundation Model Availability to check whether the account can actually invoke it.',
    idempotent: true,
  },
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      description: 'The modelId or modelArn returned by List Foundation Models, e.g. "amazon.nova-micro-v1:0".',
      required: true,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(new GetFoundationModelCommand({ modelIdentifier: propsValue.modelId }));
    return bedrockAi.body(response);
  },
});
