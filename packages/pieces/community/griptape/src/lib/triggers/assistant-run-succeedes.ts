import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  StaticPropsValue,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { griptapeAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { assistantIdDropdown } from '../common/props';

const props = {
  assistant_id: assistantIdDropdown,
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof griptapeAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, auth, lastFetchEpochMS }) => {
    const { assistant_id } = propsValue;

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/assistants/${assistant_id}/runs?status=SUCCEEDED&page_size=100`
      );

      const items = response.assistant_runs || [];

      const succeededRuns = items.filter(
        (run: any) =>
          run.status === 'SUCCEEDED' &&
          dayjs(run.completed_at || run.updated_at).valueOf() > lastFetchEpochMS
      );

      return succeededRuns.map((run: any) => ({
        epochMilliSeconds: dayjs(run.completed_at || run.updated_at).valueOf(),
        data: run,
      }));
    } catch (error) {
      console.error('Error fetching assistant runs:', error);
      return [];
    }
  },
};

export const assistantRunSucceedes = createTrigger({
  auth: griptapeAuth,
  name: 'assistantRunSucceedes',
  displayName: 'Assistant Run Succeeds',
  description: 'Trigger when an assistant run succeeds',
  props,
  sampleData: {
    assistant_run_id: 'sample-run-id',
    assistant_id: 'sample-assistant-id',
    status: 'SUCCEEDED',
    output: 'Sample output from assistant run',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
