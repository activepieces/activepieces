import { createAction, Property } from '@activepieces/pieces-framework';
import { EndSessionCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockEndSessionOutputSchema } from '../../../output-schemas';

export const amazonBedrockEndSession = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_end_session',
  outputSchema: amazonBedrockEndSessionOutputSchema,
  displayName: 'End Session',
  description: 'Ends a Bedrock session so nothing more can be added to it.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Ends an Amazon Bedrock session (sessionId or sessionArn from Create Session or List Sessions), setting its status to ENDED: its invocations and steps stay readable but nothing more can be added. Pick it over Delete Session to keep the history; a session must be ended before Delete Session can remove it.',
    idempotent: true,
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
    const response = await client.send(new EndSessionCommand({ sessionIdentifier: propsValue.sessionId }));
    return bedrockAi.body(response);
  },
});
