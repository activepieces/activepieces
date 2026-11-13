import { createAction, Property } from '@activepieces/pieces-framework';
import { GetPromptRouterCommand } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockGetPromptRouterOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetPromptRouter = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_prompt_router',
  outputSchema: amazonBedrockGetPromptRouterOutputSchema,
  displayName: 'Get Prompt Router',
  description: 'Gets the details of one prompt router.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Amazon Bedrock prompt router by the promptRouterArn from List Prompt Routers: the models it chooses between, its fallback model, its routing criteria and status.',
    idempotent: true,
  },
  props: {
    promptRouterArn: Property.ShortText({
      displayName: 'Prompt Router ARN',
      description: 'The promptRouterArn returned by List Prompt Routers.',
      required: true,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(new GetPromptRouterCommand({ promptRouterArn: propsValue.promptRouterArn }));
    return bedrockAi.body(response);
  },
});
