import { createAction, Property } from '@activepieces/pieces-framework';
import { CreateInvocationCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockCreateSessionInvocationOutputSchema } from '../../../output-schemas';

export const amazonBedrockCreateSessionInvocation = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_create_session_invocation',
  outputSchema: amazonBedrockCreateSessionInvocationOutputSchema,
  displayName: 'Create Session Invocation',
  description: 'Starts an invocation that groups related steps in a Bedrock session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an invocation in an ACTIVE Amazon Bedrock session (sessionId or sessionArn from Create Session or List Sessions); an invocation groups the steps of one interaction. Returns the invocationId that Put Session Invocation Step takes. Not idempotent: each call creates a new invocation.',
    idempotent: false,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The sessionId or sessionArn returned by Create Session or List Sessions.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'What this interaction is about, e.g. "User asking about weather in Seattle".',
      required: false,
    }),
    invocationId: Property.ShortText({
      displayName: 'Invocation ID',
      description: 'A UUID to use as the invocation id. Leave empty to let Bedrock generate one.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agentRuntime({ auth: auth.props, server });
    const response = await client.send(
      new CreateInvocationCommand({
        sessionIdentifier: propsValue.sessionId,
        description: propsValue.description || undefined,
        invocationId: propsValue.invocationId || undefined,
      }),
    );
    return bedrockAi.body(response);
  },
});
