import { createAction, Property } from '@activepieces/pieces-framework';
import { ListPromptsCommand } from '@aws-sdk/client-bedrock-agent';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockListPromptsOutputSchema } from '../../../output-schemas';

export const amazonBedrockListPrompts = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_list_prompts',
  outputSchema: amazonBedrockListPromptsOutputSchema,
  displayName: 'List Prompts',
  description: 'Lists the prompts saved in Bedrock Prompt Management.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Amazon Bedrock Prompt Management prompts one page at a time, with each prompt\'s id, ARN, name and version; given a prompt id from Create Prompt or this list, lists that prompt\'s DRAFT and published versions instead. The id is what Get Prompt, Update Prompt, Create Prompt Version and Delete Prompt take, and the ARN runs the prompt as the model id in Converse. Pass nextToken to continue.',
    idempotent: true,
  },
  props: {
    promptId: Property.ShortText({
      displayName: 'Prompt ID',
      description: 'The id or ARN of a prompt, from Create Prompt or List Prompts, to list its versions. Leave empty to list all prompts.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of prompts to return (1–1000). Defaults to 50.',
      required: false,
    }),
    nextToken: Property.ShortText({
      displayName: 'Next Token',
      description: 'The nextToken from a previous call, to get the next page.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agent({ auth: auth.props, server });
    const response = await client.send(
      new ListPromptsCommand({
        promptIdentifier: propsValue.promptId || undefined,
        maxResults: bedrockAi.clampLimit({ limit: propsValue.limit, max: 1000 }),
        nextToken: propsValue.nextToken || undefined,
      }),
    );
    const prompts = response.promptSummaries ?? [];
    return { prompts, count: prompts.length, nextToken: response.nextToken ?? null };
  },
});
