import { langsmithAuth } from '../../';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { langsmithApiCall } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof langsmithAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await langsmithApiCall<{ runs: Array<{ id: string; start_time: string; [key: string]: unknown }> }>({
      apiKey: auth,
      method: HttpMethod.POST,
      path: '/runs/query',
      body: {
        is_root: true,
        limit: 50,
      },
    });
    const runs = response.body.runs ?? response.body ?? [];
    const runsList = Array.isArray(runs) ? runs : [];
    return runsList.map((run: { id: string; start_time: string; [key: string]: unknown }) => ({
      epochMilliSeconds: new Date(run.start_time).getTime(),
      data: run,
    }));
  },
};

export const newRunTrigger = createTrigger({
  auth: langsmithAuth,
  name: 'new_run',
  displayName: 'New Run',
  description: 'Triggers when a new run (trace) is created in LangSmith.',
  props: {},
  sampleData: {
    id: 'abc-123',
    name: 'Chat Pipeline',
    run_type: 'chain',
    start_time: '2024-01-01T00:00:00Z',
    status: 'success',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});