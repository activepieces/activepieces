import { APITableAuth } from '../../index';
import {
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { APITableCommon, makeClient } from '../common';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof APITableAuth>,
  { datasheet_id: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue: { datasheet_id }, lastFetchEpochMS }) => {
    const client = makeClient(
      auth as PiecePropValueSchema<typeof APITableAuth>
    );
    const records = await client.listRecords(datasheet_id as string, {
      filterByFormula: `CREATED_TIME() > ${
        lastFetchEpochMS === 0
          ? dayjs().subtract(1, 'day').valueOf()
          : lastFetchEpochMS
      }`,
    });

    return records.data.records.map((record) => {
      return {
        epochMilliSeconds: record.createdAt,
        data: record,
      };
    });
  },
};

export const newRecordTrigger = createTrigger({
  auth: APITableAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is added to a datasheet.',
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
  },
  sampleData: {
    recordId: 'rec2T5ppW1Mal',
    createdAt: 1689772153000,
    updatedAt: 1689772153000,
    fields: {
      Title: 'mhm',
      AmazingField: 'You are really looking at this?',
      'Long text': 'veeeeeeeery long text',
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: { datasheet_id: context.propsValue.datasheet_id },
      files: context.files,
    });
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: { datasheet_id: context.propsValue.datasheet_id },
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: { datasheet_id: context.propsValue.datasheet_id },
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: { datasheet_id: context.propsValue.datasheet_id },
      files: context.files,
    });
  },
});
