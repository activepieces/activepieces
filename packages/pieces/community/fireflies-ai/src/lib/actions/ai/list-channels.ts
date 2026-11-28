import { createAction } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const listChannelsAction = createAction({
  auth: firefliesAiAuth,
  name: 'list_channels',
  classification: 'SEARCH',
  displayName: 'List Channels',
  description: 'Lists the Fireflies channels the user can see.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Fireflies channels visible to the API key owner (team channels plus private channels they belong to), with channel ID, title and members. Use the ID with Find Meetings or Move Meetings to Channel. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.listChannels,
  props: {},
  async run({ auth }) {
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.listChannels,
      operation: 'list channels',
    });
    const channels = firefliesClient.recordList(data['channels']);
    return { channels, count: channels.length };
  },
});
