import { createAction, Property } from '@activepieces/pieces-framework';
import { GetSessionCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockGetSessionOutputSchema } from '../../../output-schemas';

export const amazonBedrockGetSession = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_get_session',
  outputSchema: amazonBedrockGetSessionOutputSchema,
  displayName: 'Get Session',
  description: 'Gets the details of one Bedrock session.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Amazon Bedrock session by the sessionId or sessionArn from Create Session or List Sessions: its status (ACTIVE, ENDED or EXPIRED), metadata, encryption key and timestamps. Use List Session Invocations to read what the session stored.',
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
    const response = await client.send(new GetSessionCommand({ sessionIdentifier: propsValue.sessionId }));
    return bedrockAi.body(response);
  },
});
