import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostSearchAllChannelsOutputSchema } from '../../../output-schemas';

export const searchAllChannelsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_search_all_channels',
  outputSchema: mattermostSearchAllChannelsOutputSchema,
  displayName: 'Search All Channels',
  description: 'Searches public and private channels across all teams.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches public and private channels across all teams by name, display name or purpose. An admin-level search; to search one team\'s channels as a regular member use Search Channels.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Term',
      description: 'Text to match against the channel name, display name and purpose.',
      required: true,
    }),
    teamIds: Property.Array({
      displayName: 'Team IDs',
      description: 'Only channels in these teams. Use List Teams to find them.',
      required: false,
    }),
    publicOnly: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Public',
      description: '"true" to return public channels. Combine with Private to get both; leave both empty for both.',
    }),
    privateOnly: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Private',
      description: '"true" to return private channels. Combine with Public to get both; leave both empty for both.',
    }),
    deleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Archived Only',
      description: '"true" to return only archived channels.',
    }),
    excludeDefaultChannels: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Exclude Default Channels',
      description: '"true" to leave out default channels such as Town Square and Off-Topic.',
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { term, teamIds, publicOnly, privateOnly, deleted, excludeDefaultChannels, page, perPage } =
      context.propsValue;
    const isPublic = mattermostUtils.parseBoolean({ value: publicOnly });
    const isPrivate = mattermostUtils.parseBoolean({ value: privateOnly });
    const isDeleted = mattermostUtils.parseBoolean({ value: deleted });
    const excludeDefault = mattermostUtils.parseBoolean({ value: excludeDefaultChannels });
    const paging = mattermostUtils.paging({ page, perPage });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/channels/search',
      body: {
        term,
        page: Number(paging.page),
        per_page: Number(paging.per_page),
        ...(teamIds && teamIds.length > 0 ? { team_ids: teamIds } : {}),
        ...(isPublic !== undefined ? { public: isPublic } : {}),
        ...(isPrivate !== undefined ? { private: isPrivate } : {}),
        ...(isDeleted !== undefined ? { deleted: isDeleted } : {}),
        ...(excludeDefault !== undefined ? { exclude_default_channels: excludeDefault } : {}),
      },
    });
  },
});
