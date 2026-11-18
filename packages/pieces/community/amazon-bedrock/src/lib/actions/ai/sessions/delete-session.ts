import { createAction, Property } from '@activepieces/pieces-framework';
import { DeleteSessionCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';

export const amazonBedrockDeleteSession = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_delete_session',
  displayName: 'Delete Session',
  description: 'Permanently deletes an ended Bedrock session and its content.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an Amazon Bedrock session (sessionId or sessionArn from Create Session or List Sessions) with all its invocations and steps; this cannot be undone. Bedrock rejects an ACTIVE session, so call End Session first; use End Session alone to keep the history readable.',
    idempotent: false,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The sessionId or sessionArn returned by Create Session or List Sessions.',
      required: true,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agentRuntime({ auth: auth.props, server });
    const response = await client.send(new DeleteSessionCommand({ sessionIdentifier: propsValue.sessionId }));
    return bedrockAi.body(response);
  },
});
