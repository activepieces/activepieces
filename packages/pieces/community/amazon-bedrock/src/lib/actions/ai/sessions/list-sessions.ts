import { createAction, Property } from '@activepieces/pieces-framework';
import { ListSessionsCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockListSessionsOutputSchema } from '../../../output-schemas';

export const amazonBedrockListSessions = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_list_sessions',
  outputSchema: amazonBedrockListSessionsOutputSchema,
  displayName: 'List Sessions',
  description: 'Lists the Bedrock sessions in the connected region.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Amazon Bedrock sessions in the account and region one page at a time, each with its sessionId, sessionArn, status and timestamps. The sessionId works in every other session action; pass nextToken to continue.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (1–1000). Defaults to 50.',
      required: false,
    }),
    nextToken: Property.ShortText({
      displayName: 'Next Token',
      description: 'The nextToken from a previous call, to get the next page.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agentRuntime({ auth: auth.props, server });
    const response = await client.send(
      new ListSessionsCommand({
        maxResults: bedrockAi.clampLimit({ limit: propsValue.limit, max: 1000 }),
        nextToken: propsValue.nextToken || undefined,
      }),
    );
    const sessions = response.sessionSummaries ?? [];
    return { sessions, count: sessions.length, nextToken: response.nextToken ?? null };
  },
});
