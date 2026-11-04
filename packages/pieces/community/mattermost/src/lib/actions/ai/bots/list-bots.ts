import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListBotsOutputSchema } from '../../../output-schemas';

export const listBotsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_bots',
  outputSchema: mattermostListBotsOutputSchema,
  displayName: 'List Bots',
  description: 'Lists bot accounts.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a page of bot accounts with their user IDs, usernames and owners. Bots managed by other users need the read_others_bots permission. A bot\'s user_id is the Bot User ID the other bot actions take.',
    idempotent: true,
  },
  props: {
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Disabled',
      description: '"true" to include disabled bots. Defaults to "false".',
    }),
    onlyOrphaned: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Only Orphaned',
      description: '"true" to return only bots whose owner has been deactivated. Defaults to "false".',
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { includeDeleted, onlyOrphaned, page, perPage } = context.propsValue;
    const deleted = mattermostUtils.parseBoolean({ value: includeDeleted });
    const orphaned = mattermostUtils.parseBoolean({ value: onlyOrphaned });
    const bots = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/bots',
      query: {
        ...mattermostUtils.paging({ page, perPage }),
        ...(deleted !== undefined ? { include_deleted: String(deleted) } : {}),
        ...(orphaned !== undefined ? { only_orphaned: String(orphaned) } : {}),
      },
    });
    return { bots, count: bots.length };
  },
});
