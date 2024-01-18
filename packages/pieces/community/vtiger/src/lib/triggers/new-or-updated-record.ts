import {
  DedupeStrategy,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  PiecePropValueSchema,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import {
  elementTypeProperty,
  instanceLogin,
  prepareHttpRequest,
} from '../common';
import dayjs from 'dayjs';
import { filter, sortBy } from 'lodash';

export const newOrUpdatedRecord = createTrigger({
  auth: vtigerAuth,
  name: 'new_or_updated_record',
  displayName: 'New or Updated Record',
  description:
    'Triggers when a new record is introduced or a record is updated.',
  props: {
    elementType: elementTypeProperty,
    watchBy: Property.StaticDropdown({
      displayName: 'Watch By',
      description: 'Column to watch for trigger',
      required: true,
      options: {
        options: [
          { value: 'createdtime', label: 'Created Time' },
          { value: 'modifiedtime', label: 'Modified Time' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Enter the maximum number of records to return.',
      defaultValue: 100,
      required: true,
    }),
  },
  sampleData: {
    success: true,
    result: [
      {
        id: '3x291',
        createdtime: '2020-07-22 12:46:55',
        modifiedtime: '2020-07-22 12:46:55',
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, { ...ctx });
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, { ...ctx });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, { ...ctx });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, { ...ctx });
  },
});

const polling: Polling<
  PiecePropValueSchema<typeof vtigerAuth>,
  { elementType?: string; watchBy?: string; limit?: number }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await fetchRecords({ auth, propsValue, lastFetchEpochMS });

    return (items ?? []).map((item) => {
      return {
        epochMilliSeconds: dayjs(
          propsValue.watchBy === 'createdtime'
            ? item['createdtime']
            : item['modifiedtime']
        ).valueOf(),
        data: item,
      };
    });
  },
};

const fetchRecords = async ({
  auth,
  propsValue,
  lastFetchEpochMS,
}: {
  auth: Record<string, string>;
  propsValue: Record<string, unknown>;
  lastFetchEpochMS: number;
}) => {
  const vtigerInstance = await instanceLogin(
    auth['instance_url'],
    auth['username'],
    auth['password']
  );
  if (vtigerInstance === null) {
    return [];
  }

  const query = `SELECT * FROM ${propsValue['elementType']} ;`;

  const httpRequest = prepareHttpRequest(
    auth['instance_url'],
    vtigerInstance.sessionId ?? vtigerInstance.sessionName,
    'query',
    { query }
  );
  const response = await httpClient.sendRequest<{
    success: boolean;
    result: Record<string, string>[];
  }>(httpRequest);

  if (response.body.success) {
    const lastFetch = dayjs(lastFetchEpochMS);
    const records = response.body.result;
    const limit = propsValue['limit'] as number;

    const newOrUpdatedRecords = filter(records, (record) => {
      const watchTime = dayjs(record[propsValue['watchBy'] as string] ?? 0);
      return watchTime.diff(lastFetch) >= 0;
    });
    const sortedRecords = sortBy(
      newOrUpdatedRecords,
      (record) => record[propsValue['watchBy'] as string]
    );

    if (limit > 0) {
      return sortedRecords.slice(0, limit);
    } else {
      return sortedRecords;
    }
  }

  return [];
};
