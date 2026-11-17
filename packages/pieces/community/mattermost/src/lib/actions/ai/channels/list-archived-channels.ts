import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListArchivedChannelsOutputSchema } from '../../../output-schemas';

export const listArchivedChannelsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_archived_channels',
  outputSchema: mattermostListArchivedChannelsOutputSchema,
  displayName: 'List Archived Channels',
  description: 'Lists the archived channels of a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a page of a team\'s archived channels, the ones Archive Channel hid. Pass a channel\'s ID to Restore Channel to bring it back.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { teamId, page, perPage } = context.propsValue;
    const channels = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/${encodeURIComponent(teamId)}/channels/deleted`,
      query: mattermostUtils.paging({ page, perPage }),
    });
    return { channels, count: channels.length };
  },
});
