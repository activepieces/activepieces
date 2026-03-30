import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  bigQueryAuth,
  BigQueryAuthValue,
  BASE_URL,
  getAccessToken,
} from './lib/common';

// Actions
import { runQueryAction } from './lib/actions/run-query';
import { createRowAction } from './lib/actions/create-row';
import { createRowsAction } from './lib/actions/create-rows';
import { deleteRowsAction } from './lib/actions/delete-rows';
import { updateRowsAction } from './lib/actions/update-rows';
import { findOneRowAction } from './lib/actions/find-one-row';
import { findOrCreateRowAction } from './lib/actions/find-or-create-row';
import { getRowsForJobAction } from './lib/actions/get-rows-for-job';
import { importDataAction } from './lib/actions/import-data';

// Triggers
import { newRowTrigger } from './lib/triggers/new-row';
import { updatedRowTrigger } from './lib/triggers/updated-row';
import { queryJobCompletedTrigger } from './lib/triggers/query-job-completed';
import { newJobCompletedTrigger } from './lib/triggers/new-job-completed';

export { bigQueryAuth };
export type { BigQueryAuthValue };

export const googleBigQuery = createPiece({
  displayName: 'Google BigQuery',
  description:
    'Query, analyze, and stream data into Google BigQuery — the fully managed, serverless data warehouse',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-bigquery.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['AhmadTash'],
  auth: bigQueryAuth,
  actions: [
    runQueryAction,
    createRowAction,
    createRowsAction,
    deleteRowsAction,
    updateRowsAction,
    findOneRowAction,
    findOrCreateRowAction,
    getRowsForJobAction,
    importDataAction,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: bigQueryAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await getAccessToken(
          auth as BigQueryAuthValue
        )}`,
      }),
    }),
  ],
  triggers: [
    newRowTrigger,
    updatedRowTrigger,
    queryJobCompletedTrigger,
    newJobCompletedTrigger,
  ],
});
