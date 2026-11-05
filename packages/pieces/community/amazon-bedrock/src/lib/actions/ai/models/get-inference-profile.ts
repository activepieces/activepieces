import { createAction, Property } from '@activepieces/pieces-framework';
import { GetInferenceProfileCommand } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockGetInferenceProfileOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetInferenceProfile = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_inference_profile',
  outputSchema: amazonBedrockGetInferenceProfileOutputSchema,
  displayName: 'Get Inference Profile',
  description: 'Gets the details of one inference profile.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Amazon Bedrock inference profile by the inferenceProfileId or ARN from List Inference Profiles: its type, status and the model ARNs in each region it routes to.',
    idempotent: true,
  },
  props: {
    inferenceProfileId: Property.ShortText({
      displayName: 'Inference Profile ID',
      description: 'The inferenceProfileId or inferenceProfileArn returned by List Inference Profiles.',
      required: true,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(
      new GetInferenceProfileCommand({ inferenceProfileIdentifier: propsValue.inferenceProfileId }),
    );
    return bedrockAi.body(response);
  },
});
