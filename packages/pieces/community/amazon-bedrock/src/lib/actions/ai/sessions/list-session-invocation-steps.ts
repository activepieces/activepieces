import { createAction, Property } from '@activepieces/pieces-framework';
import { ListInvocationStepsCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockListSessionInvocationStepsOutputSchema } from '../../../output-schemas';

export const amazonBedrockListSessionInvocationSteps = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_list_session_invocation_steps',
  outputSchema: amazonBedrockListSessionInvocationStepsOutputSchema,
  displayName: 'List Session Invocation Steps',
  description: 'Lists the steps stored in a Bedrock session, optionally for one invocation.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the invocation steps of an Amazon Bedrock session (sessionId from Create Session or List Sessions) one page at a time, optionally only those of one invocationId from Create Session Invocation or List Session Invocations. Returns step summaries without payloads; read a step\'s content with Get Session Invocation Step and pass nextToken to continue.',
    idempotent: true,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The sessionId or sessionArn returned by Create Session or List Sessions.',
      required: true,
    }),
    invocationId: Property.ShortText({
      displayName: 'Invocation ID',
      description:
        'Only steps of this invocation: an invocationId from Create Session Invocation or List Session Invocations. Leave empty for every step in the session.',
      required: false,
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
      new ListInvocationStepsCommand({
        sessionIdentifier: propsValue.sessionId,
        invocationIdentifier: propsValue.invocationId || undefined,
        maxResults: bedrockAi.clampLimit({ limit: propsValue.limit, max: 1000 }),
        nextToken: propsValue.nextToken || undefined,
      }),
    );
    const invocationSteps = response.invocationStepSummaries ?? [];
    return { invocationSteps, count: invocationSteps.length, nextToken: response.nextToken ?? null };
  },
});
