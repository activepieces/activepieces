import { createAction, Property } from '@activepieces/pieces-framework';
import { DeletePromptCommand } from '@aws-sdk/client-bedrock-agent';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockDeletePromptOutputSchema } from '../../../output-schemas';

export const amazonBedrockDeletePrompt = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_delete_prompt',
  outputSchema: amazonBedrockDeletePromptOutputSchema,
  displayName: 'Delete Prompt',
  description: 'Deletes a prompt, or one published version of it.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an Amazon Bedrock prompt by the id or ARN from Create Prompt or List Prompts, with its DRAFT and every published version; give a version number from Create Prompt Version or List Prompts to delete only that version. There is no undo.',
    idempotent: false,
  },
  props: {
    promptId: Property.ShortText({
      displayName: 'Prompt ID',
      description: 'The id or ARN of the prompt, from Create Prompt or List Prompts.',
      required: true,
    }),
    promptVersion: Property.ShortText({
      displayName: 'Prompt Version',
      description: 'A published version number, e.g. "1", to delete only that version. Leave empty to delete the whole prompt.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agent({ auth: auth.props, server });
    const response = await client.send(
      new DeletePromptCommand({
        promptIdentifier: propsValue.promptId,
        promptVersion: propsValue.promptVersion || undefined,
      }),
    );
    return bedrockAi.body(response);
  },
});
