import { createAction, Property } from '@activepieces/pieces-framework';
import { GetPromptCommand } from '@aws-sdk/client-bedrock-agent';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockCreatePromptVersionOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetPrompt = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_prompt',
  outputSchema: amazonBedrockCreatePromptVersionOutputSchema,
  displayName: 'Get Prompt',
  description: 'Gets one prompt from Bedrock Prompt Management.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Amazon Bedrock Prompt Management prompt by the id or ARN from Create Prompt or List Prompts: its variants with the template text (variables appear as {{name}}), model id, inference settings, default variant and version. Reads the working DRAFT unless a version number from Create Prompt Version or List Prompts is given.',
    idempotent: true,
  },
  props: {
    promptId: Property.ShortText({
      displayName: 'Prompt ID',
      description: 'The id or ARN of the prompt, from Create Prompt or List Prompts.',
      required: true,
    }),
    promptVersion: Property.ShortText({
      displayName: 'Prompt Version',
      description: 'A published version number, e.g. "1", from Create Prompt Version. Leave empty for the working DRAFT.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agent({ auth: auth.props, server });
    const response = await client.send(
      new GetPromptCommand({
        promptIdentifier: propsValue.promptId,
        promptVersion: propsValue.promptVersion || undefined,
      }),
    );
    return bedrockAi.body(response);
  },
});
