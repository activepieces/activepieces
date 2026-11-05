import { createAction, Property } from '@activepieces/pieces-framework';
import { UpdateSessionCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockCreateSessionOutputSchema } from '../../../output-schemas';

export const amazonBedrockUpdateSession = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_update_session',
  outputSchema: amazonBedrockCreateSessionOutputSchema,
  displayName: 'Update Session',
  description: 'Replaces the metadata stored with a Bedrock session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the whole metadata map of an Amazon Bedrock session (sessionId or sessionArn from Create Session or List Sessions): keys you leave out are removed, so read the current sessionMetadata with Get Session and send every key to keep. Values are stored as text.',
    idempotent: true,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The sessionId or sessionArn returned by Create Session or List Sessions.',
      required: true,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description:
        'The full set of key-value pairs to store with the session, e.g. {"userId": "123"}. Replaces the existing metadata. Values are stored as text.',
      required: true,
    }),
  },
  async run({ auth, propsValue, server }) {
    const metadata = Object.entries(propsValue.metadata);
    const client = await bedrockAi.agentRuntime({ auth: auth.props, server });
    const response = await client.send(
      new UpdateSessionCommand({
        sessionIdentifier: propsValue.sessionId,
        sessionMetadata: Object.fromEntries(metadata.map(([key, value]) => [key, String(value)])),
      }),
    );
    return bedrockAi.body(response);
  },
});
