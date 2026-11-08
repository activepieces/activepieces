import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseListCronsOutputSchema } from '../../../output-schemas';

export const listCronsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_list_crons',
  outputSchema: pocketbaseListCronsOutputSchema,
  displayName: 'List Cron Jobs',
  description: 'Lists the registered cron jobs.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists every registered cron job with its ID and schedule expression, including built-in ones like log cleanup. The ID is what Run Cron Job takes.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const crons = await pocketbaseClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/crons',
    });
    return { crons, count: crons.length };
  },
});
