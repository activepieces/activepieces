import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  StaticPropsValue,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { structureIdDropdown } from '../common/props';
import { griptapeAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const props = {
  structure_id: structureIdDropdown,
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof griptapeAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, auth, lastFetchEpochMS }) => {
    const { structure_id } = propsValue;
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/structures/${structure_id}/runs?status=SUCCEEDED,FAILED,ERROR,CANCELLED&page_size=100`
      );

      const items = response.structure_runs || [];

      const completedRuns = items.filter(
        (run: any) =>
          ['SUCCEEDED', 'FAILED', 'ERROR', 'CANCELLED'].includes(run.status) &&
          dayjs(run.completed_at || run.updated_at).valueOf() > lastFetchEpochMS
      );

      return completedRuns.map((run: any) => ({
        epochMilliSeconds: dayjs(run.completed_at || run.updated_at).valueOf(),
        data: run,
      }));
    } catch (error) {
      console.error('Error fetching assistant runs:', error);
      return [];
    }
  },
};

export const structureRunCompletes = createTrigger({
  auth: griptapeAuth,
  name: 'structureRunCompletes',
  displayName: 'Structure Run Completes',
  description: '',
  props,
  sampleData: {},
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
