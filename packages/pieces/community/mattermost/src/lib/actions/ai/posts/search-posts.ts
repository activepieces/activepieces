import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostSearchPostsOutputSchema } from '../../../output-schemas';

export const searchPostsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_search_posts',
  outputSchema: mattermostSearchPostsOutputSchema,
  displayName: 'Search Posts',
  description: 'Searches posts by text in one team or across all teams.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the posts the connected user can see, in one team when Team ID is set, otherwise across all teams. Terms support Mattermost search modifiers such as from:username, in:channel-name, before:/after:/on: YYYY-MM-DD and "exact phrase".',
    idempotent: true,
  },
  props: {
    terms: Property.ShortText({
      displayName: 'Terms',
      description:
        'Search text. Add from:username for a user\'s posts or in:channel-name (the channel name, not its display name) for one channel.',
      required: true,
    }),
    teamId: mattermostAiProps.teamId({
      required: false,
      description:
        'Team ID (26 characters) to search in. Leave empty to search all teams. Use List Teams or Get Team By Name to find it.',
    }),
    isOrSearch: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Match Any Term',
      description: '"true" to match posts with any of the terms instead of all of them. Defaults to "false".',
    }),
    includeDeletedChannels: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Archived Channels',
      description: '"true" to also search archived channels. Defaults to "false".',
    }),
    timeZoneOffset: Property.Number({
      displayName: 'Time Zone Offset',
      description: 'Offset from UTC in seconds, used for date modifiers such as on:. Defaults to 0.',
      required: false,
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { terms, teamId, isOrSearch, includeDeletedChannels, timeZoneOffset, page, perPage } =
      context.propsValue;
    const archived = mattermostUtils.parseBoolean({ value: includeDeletedChannels });
    const paging = mattermostUtils.paging({ page, perPage });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: teamId ? `/teams/${encodeURIComponent(teamId)}/posts/search` : '/posts/search',
      body: {
        terms,
        is_or_search: mattermostUtils.parseBoolean({ value: isOrSearch }) ?? false,
        page: Number(paging.page),
        per_page: Number(paging.per_page),
        ...(archived !== undefined ? { include_deleted_channels: archived } : {}),
        ...(timeZoneOffset !== undefined ? { time_zone_offset: timeZoneOffset } : {}),
      },
    });
  },
});
