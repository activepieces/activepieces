import { APITableAuth } from '../auth';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { APITableCommon, makeClient } from '../common';
import { AITableClient } from '../common/client';
import dayjs from 'dayjs';
import { newRecordTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
   AppConnectionValueForAuthProperty<typeof APITableAuth>,
  { datasheet_id: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue: { datasheet_id }, lastFetchEpochMS }) => {
    const client = makeClient(
      auth.props
    );
    const records = await listRecordsCreatedAfter({
      client,
      datasheetId: datasheet_id,
      createdAfter:
        lastFetchEpochMS === 0
          ? dayjs().subtract(1, 'day').valueOf()
          : lastFetchEpochMS,
      pageNum: 1,
    });

    return records.map((record) => {
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
  classification: 'READ',
  displayName: 'New Record',
  description: 'Triggers when a new record is added to a datasheet.',
  aiMetadata: {
    description:
      'Fires when a new record is created in the selected AITable datasheet. Polls by creation time, so each newly added row in the chosen space and datasheet surfaces as one event.',
  },
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
  },
  outputSchema: newRecordTriggerOutputSchema,
  sampleData: {
    recordId: 'rec2T5ppW1Mal',
    createdAt: 1689772153000,
    updatedAt: 1689772153000,
    fields: {
      Title: 'Quarterly report',
      Status: 'In progress',
      Notes: 'Draft shared with the team.',
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

async function listRecordsCreatedAfter({
  client,
  datasheetId,
  createdAfter,
  pageNum,
}: {
  client: AITableClient;
  datasheetId: string;
  createdAfter: number;
  pageNum: number;
}): Promise<ListedRecord[]> {
  const page = await client.listRecords(datasheetId, {
    pageSize: String(PAGE_SIZE),
    pageNum: String(pageNum),
    filterByFormula: `CREATED_TIME() > ${createdAfter}`,
  });
  const records = page.data.records;
  const fetchedSoFar = (pageNum - 1) * PAGE_SIZE + records.length;
  if (records.length === 0 || fetchedSoFar >= page.data.total) {
    return records;
  }
  const nextPages = await listRecordsCreatedAfter({
    client,
    datasheetId,
    createdAfter,
    pageNum: pageNum + 1,
  });
  return [...records, ...nextPages];
}

const PAGE_SIZE = 1000;

type ListedRecord = Awaited<
  ReturnType<AITableClient['listRecords']>
>['data']['records'][number];
