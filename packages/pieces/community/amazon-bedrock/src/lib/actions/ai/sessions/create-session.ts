import { createAction, Property } from '@activepieces/pieces-framework';
import { CreateSessionCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockCreateSessionOutputSchema } from '../../../output-schemas';

export const amazonBedrockCreateSession = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_create_session',
  outputSchema: amazonBedrockCreateSessionOutputSchema,
  displayName: 'Create Session',
  description: 'Starts a Bedrock session that stores conversation state.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an Amazon Bedrock session, a server-side store for one conversation\'s state that later steps add invocations and steps to (Create Session Invocation, Put Session Invocation Step). Returns the sessionId the other session actions take; the session stays ACTIVE until End Session. Not idempotent: each call creates a new session.',
    idempotent: false,
  },
  props: {
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Key-value pairs to store with the session, e.g. {"userId": "123"}. Values are stored as text.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const metadata = Object.entries(propsValue.metadata ?? {});
    const client = await bedrockAi.agentRuntime({ auth: auth.props, server });
    const response = await client.send(
      new CreateSessionCommand({
        sessionMetadata:
          metadata.length > 0 ? Object.fromEntries(metadata.map(([key, value]) => [key, String(value)])) : undefined,
      }),
    );
    return bedrockAi.body(response);
  },
});
