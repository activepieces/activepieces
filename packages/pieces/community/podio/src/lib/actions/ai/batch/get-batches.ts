import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetBatchesOutputSchema } from '../../../output-schemas';

export const getBatchesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_batches',
  outputSchema: podioGetBatchesOutputSchema,
  displayName: 'Get Batches',
  description: 'Lists the import and export batches of the current user, newest first.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio batches (background import and export jobs) the connected user created, newest first, with status and progress. Use Get Running Batches for the jobs still running on one app or workspace.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: '/batch/' });
    return { batches: body, count: body.length };
  },
});
