import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  isNil,
  OutputSchema,
  InputPropertyMap,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';

function createdEpoch(record: NinetyCreatedRecord): number {
  if (isNil(record.createdDate)) {
    return 0;
  }
  const parsed = new Date(record.createdDate).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function createNinetyPollingTrigger<
  P extends InputPropertyMap,
  R extends NinetyCreatedRecord
>({
  name,
  displayName,
  description,
  aiDescription,
  props,
  sampleData,
  outputSchema,
  fetchRecords,
}: {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  props: P;
  sampleData: unknown;
  outputSchema: OutputSchema;
  fetchRecords: (params: {
    token: string;
    propsValue: StaticPropsValue<P>;
    since: number;
  }) => Promise<R[]>;
}) {
  const polling: Polling<
    AppConnectionValueForAuthProperty<typeof ninetyAuth>,
    StaticPropsValue<P>
  > = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
      const records = await fetchRecords({
        token: auth.secret_text,
        propsValue,
        since: lastFetchEpochMS,
      });
      return records
        .map((record) => ({
          epochMilliSeconds: createdEpoch(record),
          data: record,
        }))
        .filter((item) => item.epochMilliSeconds > 0);
    },
  };

  return createTrigger({
    auth: ninetyAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    props,
    sampleData,
    outputSchema,
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
}

export type NinetyCreatedRecord = {
  createdDate?: string;
};
