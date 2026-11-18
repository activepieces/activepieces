import { createAction, Property } from '@activepieces/pieces-framework';
import { CreatePromptVersionCommand } from '@aws-sdk/client-bedrock-agent';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockCreatePromptVersionOutputSchema } from '../../../output-schemas';

export const amazonBedrockCreatePromptVersion = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_create_prompt_version',
  outputSchema: amazonBedrockCreatePromptVersionOutputSchema,
  displayName: 'Create Prompt Version',
  description: 'Publishes the current draft of a prompt as a new numbered version.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Publishes a snapshot of an Amazon Bedrock prompt\'s working DRAFT as an immutable numbered version, taking the prompt id or ARN from Create Prompt or List Prompts. Returns the version number and the versioned ARN, which runs that exact version as the model id in Converse. Not idempotent: each call publishes a new version, even when the DRAFT has not changed.',
    idempotent: false,
  },
  props: {
    promptId: Property.ShortText({
      displayName: 'Prompt ID',
      description: 'The id or ARN of the prompt, from Create Prompt or List Prompts.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'What changed in this version.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agent({ auth: auth.props, server });
    const response = await client.send(
      new CreatePromptVersionCommand({
        promptIdentifier: propsValue.promptId,
        description: propsValue.description || undefined,
      }),
    );
    return bedrockAi.body(response);
  },
});
