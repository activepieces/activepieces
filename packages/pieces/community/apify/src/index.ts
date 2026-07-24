import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { getDatasetItems } from './lib/actions/get-dataset-items';
import { runActor } from './lib/actions/run-actor';
import { createApifyClient } from './lib/common';
import { getKeyValueStoreRecord } from './lib/actions/get-key-value-store-record';
import { scrapeSingleUrl } from './lib/actions/scrape-single-url';
import { runTask } from './lib/actions/run-task';
import { watchTaskRunsTrigger } from './lib/triggers/watch-task-runs';
import { watchActorRunsTrigger } from './lib/triggers/watch-actor-runs';
// audience:'ai' atomics
import { apifyRunActor } from './lib/actions/run-actor-ai';
import { apifyRunTask } from './lib/actions/run-task-ai';
import { apifyGetDatasetItems } from './lib/actions/get-dataset-items-ai';
import { apifyGetKeyValueStoreRecord } from './lib/actions/get-key-value-store-record-ai';
import { apifyScrapeUrl } from './lib/actions/scrape-url-ai';
import { apifyFindActor } from './lib/actions/find-actor';
import { apifyGetActor } from './lib/actions/get-actor';
import { apifyListActors } from './lib/actions/list-actors';
import { apifyGetActorInputSchema } from './lib/actions/get-actor-input-schema';
import { apifyGetActorRun } from './lib/actions/get-actor-run';
import { apifyAbortActorRun } from './lib/actions/abort-actor-run';
import { apifyListActorRuns } from './lib/actions/list-actor-runs';
import { apifyListRuns } from './lib/actions/list-runs';
import { apifyGetLastActorRun } from './lib/actions/get-last-actor-run';
import { apifyGetRunLog } from './lib/actions/get-run-log';
import { apifyGetBuild } from './lib/actions/get-build';
import { apifyGetRunDatasetItems } from './lib/actions/get-run-dataset-items';
import { apifyGetActorLastRunDatasetItems } from './lib/actions/get-actor-last-run-dataset-items';
import { apifyGetTaskLastRunDatasetItems } from './lib/actions/get-task-last-run-dataset-items';
import { apifyGetDataset } from './lib/actions/get-dataset';
import { apifyListDatasets } from './lib/actions/list-datasets';
import { apifyListKeyValueStores } from './lib/actions/list-key-value-stores';
import { apifyGetKeyValueStore } from './lib/actions/get-key-value-store';
import { apifyListKeyValueStoreKeys } from './lib/actions/list-key-value-store-keys';
import { apifyListTasks } from './lib/actions/list-tasks';
import { apifyGetTask } from './lib/actions/get-task';
import { apifyGetTaskInput } from './lib/actions/get-task-input';
import { apifyGetTaskLastRun } from './lib/actions/get-task-last-run';
import { apifyUpdateTaskInput } from './lib/actions/update-task-input';
import { apifyCreateTask } from './lib/actions/create-task';
import { apifyGetAccount } from './lib/actions/get-account';
import { apifyGetAccountLimits } from './lib/actions/get-account-limits';

export const apifyAuth = PieceAuth.CustomAuth({
  description: 'Enter API key authentication details',
  props: {
    apikey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description:
        'Find your API key on Apify in the settings, API & Integrations section.',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = createApifyClient(auth.apikey);
      await client.user('me').get();
      return { valid: true };
    } catch (error: any) {
      if (error.statusCode === 401) {
        return {
          valid: false,
          error: 'Invalid API token. Please check your token in Apify account settings.'
        };
      }

      return {
        valid: false,
        error: 'Unable to validate API token. Please check your connection and try again.'
      };
    }
  },
  required: true,
});

export const apify = createPiece({
  displayName: 'Apify',
  description: 'Access Apify tools for web scraping, data extraction, and automation.',
  auth: apifyAuth,
  minimumSupportedRelease: '0.84.6',
  logoUrl: 'https://cdn.activepieces.com/pieces/apify.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['buttonsbond'],
  actions: [getDatasetItems, runActor, runTask, getKeyValueStoreRecord, scrapeSingleUrl,
    // audience:'ai' atomics
    apifyRunActor,
    apifyRunTask,
    apifyGetDatasetItems,
    apifyGetKeyValueStoreRecord,
    apifyScrapeUrl,
    apifyFindActor,
    apifyGetActor,
    apifyListActors,
    apifyGetActorInputSchema,
    apifyGetActorRun,
    apifyAbortActorRun,
    apifyListActorRuns,
    apifyListRuns,
    apifyGetLastActorRun,
    apifyGetRunLog,
    apifyGetBuild,
    apifyGetRunDatasetItems,
    apifyGetActorLastRunDatasetItems,
    apifyGetTaskLastRunDatasetItems,
    apifyGetDataset,
    apifyListDatasets,
    apifyListKeyValueStores,
    apifyGetKeyValueStore,
    apifyListKeyValueStoreKeys,
    apifyListTasks,
    apifyGetTask,
    apifyGetTaskInput,
    apifyGetTaskLastRun,
    apifyUpdateTaskInput,
    apifyCreateTask,
    apifyGetAccount,
    apifyGetAccountLimits,
    createCustomApiCallAction({
      auth: apifyAuth,
      baseUrl: () => 'https://api.apify.com/v2',
      authMapping: async (auth) => {
        return {
          'Authorization': `Bearer ${auth.props.apikey}`
        }
      }
    })
  ],
  triggers: [watchActorRunsTrigger, watchTaskRunsTrigger],
});
