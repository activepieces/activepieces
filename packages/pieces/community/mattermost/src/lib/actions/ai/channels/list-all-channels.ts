import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListAllChannelsOutputSchema } from '../../../output-schemas';

export const listAllChannelsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_all_channels',
  outputSchema: mattermostListAllChannelsOutputSchema,
  displayName: 'List All Channels',
  description: 'Lists public and private channels across all teams.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a page of public and private channels across every team. Needs the manage_system permission; to list one team\'s channels use List Public Channels, or Search All Channels to filter by text.',
    idempotent: true,
  },
  props: {
    excludeDefaultChannels: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Exclude Default Channels',
      description: '"true" to leave out default channels such as Town Square and Off-Topic. Defaults to "false".',
    }),
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Archived',
      description: '"true" to include archived channels. Defaults to "false".',
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { excludeDefaultChannels, includeDeleted, page, perPage } = context.propsValue;
    const excludeDefault = mattermostUtils.parseBoolean({ value: excludeDefaultChannels });
    const deleted = mattermostUtils.parseBoolean({ value: includeDeleted });
    const channels = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/channels',
      query: {
        ...mattermostUtils.paging({ page, perPage }),
        ...(excludeDefault !== undefined ? { exclude_default_channels: String(excludeDefault) } : {}),
        ...(deleted !== undefined ? { include_deleted: String(deleted) } : {}),
      },
    });
    return { channels, count: channels.length };
  },
});
