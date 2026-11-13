import { createAction, Property } from '@activepieces/pieces-framework';
import { GetInvocationStepCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockGetSessionInvocationStepOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetSessionInvocationStep = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_session_invocation_step',
  outputSchema: amazonBedrockGetSessionInvocationStepOutputSchema,
  displayName: 'Get Session Invocation Step',
  description: 'Gets one stored step, with its text and images, from a Bedrock session.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one invocation step of an Amazon Bedrock session with its full payload of text and image content blocks. Takes the sessionId from Create Session or List Sessions, the invocationId from Create Session Invocation or List Session Invocations, and the invocationStepId from Put Session Invocation Step or List Session Invocation Steps.',
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
      description: 'The invocationId returned by Create Session Invocation or List Session Invocations.',
      required: true,
    }),
    invocationStepId: Property.ShortText({
      displayName: 'Invocation Step ID',
      description: 'The invocationStepId returned by Put Session Invocation Step or List Session Invocation Steps.',
      required: true,
    }),
  },
  async run({ auth, propsValue, server }) {
    const client = await bedrockAi.agentRuntime({ auth: auth.props, server });
    const response = await client.send(
      new GetInvocationStepCommand({
        sessionIdentifier: propsValue.sessionId,
        invocationIdentifier: propsValue.invocationId,
        invocationStepId: propsValue.invocationStepId,
      }),
    );
    return bedrockAi.body(response);
  },
});
