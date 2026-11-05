import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostListArchivedChannelsOutputSchema } from '../../../output-schemas';

export const searchGroupChannelsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_search_group_channels',
  outputSchema: mattermostListArchivedChannelsOutputSchema,
  displayName: 'Search Group Messages',
  description: 'Searches the connected user\'s group messages by member username.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds the connected user\'s group message channels (type "G", 3 to 8 people) whose members\' usernames match the term. For channels by name use Search Channels.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Term',
      description: 'Text to match against the usernames of the group message members.',
      required: true,
    }),
  },
  async run(context) {
    const channels = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/channels/group/search',
      body: { term: context.propsValue.term },
    });
    return { channels, count: channels.length };
  },
});
