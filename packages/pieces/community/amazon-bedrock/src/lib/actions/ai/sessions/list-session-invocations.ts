import { createAction, Property } from '@activepieces/pieces-framework';
import { ListInvocationsCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockListSessionInvocationsOutputSchema } from '../../../output-schemas';

export const amazonBedrockListSessionInvocations = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_list_session_invocations',
  outputSchema: amazonBedrockListSessionInvocationsOutputSchema,
  displayName: 'List Session Invocations',
  description: 'Lists the invocations stored in a Bedrock session.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the invocations of one Amazon Bedrock session (sessionId or sessionArn from Create Session or List Sessions) one page at a time. Each invocationId works in List Session Invocation Steps and Put Session Invocation Step; pass nextToken to continue.',
    idempotent: true,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The sessionId or sessionArn returned by Create Session or List Sessions.',
      required: true,
    }),
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
      new ListInvocationsCommand({
        sessionIdentifier: propsValue.sessionId,
        maxResults: bedrockAi.clampLimit({ limit: propsValue.limit, max: 1000 }),
        nextToken: propsValue.nextToken || undefined,
      }),
    );
    const invocations = response.invocationSummaries ?? [];
    return { invocations, count: invocations.length, nextToken: response.nextToken ?? null };
  },
});
