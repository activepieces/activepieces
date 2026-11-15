import { createAction, Property } from '@activepieces/pieces-framework';
import { ListPromptRoutersCommand, PromptRouterType } from '@aws-sdk/client-bedrock';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockListPromptRoutersOutputSchema } from '../../../output-schemas';

export const amazonBedrockListPromptRouters = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_list_prompt_routers',
  outputSchema: amazonBedrockListPromptRoutersOutputSchema,
  displayName: 'List Prompt Routers',
  description: 'Lists the prompt routers in the connected region.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Amazon Bedrock prompt routers one page at a time: AWS default routers and custom ones the account created. A router picks the cheaper or stronger model per request; pass its promptRouterArn as the model id in Converse. Pass nextToken to continue.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Only routers of this type. Leave empty for both.',
      required: false,
      options: bedrockAi.enumOptions(PromptRouterType),
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of routers to return (1–1000). Defaults to 50.',
      required: false,
    }),
    nextToken: Property.ShortText({
      displayName: 'Next Token',
      description: 'The nextToken from a previous call, to get the next page.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.control({ auth: auth.props, server });
    const response = await client.send(
      new ListPromptRoutersCommand({
        type: bedrockAi.enumValue({ value: propsValue.type, allowed: PromptRouterType, prop: 'Type' }),
        maxResults: bedrockAi.clampLimit({ limit: propsValue.limit, max: 1000 }),
        nextToken: propsValue.nextToken || undefined,
      }),
    );
    const promptRouters = response.promptRouterSummaries ?? [];
    return { promptRouters, count: promptRouters.length, nextToken: response.nextToken ?? null };
  },
});
