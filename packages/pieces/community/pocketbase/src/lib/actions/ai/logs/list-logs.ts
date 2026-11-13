import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseUtils } from '../../../common/utils';
import { pocketbaseListLogsOutputSchema } from '../../../output-schemas';

export const listLogsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_list_logs',
  outputSchema: pocketbaseListLogsOutputSchema,
  displayName: 'List Logs',
  description: 'Lists one page of request and app logs.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists one page of instance logs (requests and app events), newest first unless Sort says otherwise. Filter on fields like level, message or data.status, e.g. "level >= 8" for errors or "data.status >= 400". Page with Page while more items remain.',
    idempotent: true,
  },
  props: {
    filter: pocketbaseAiProps.filter({ required: false }),
    sort: pocketbaseAiProps.sort({ required: false }),
    page: pocketbaseAiProps.page({ required: false }),
    perPage: pocketbaseAiProps.perPage({ required: false }),
  },
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/logs',
      query: pocketbaseUtils.pageQuery(context.propsValue),
    });
  },
});
