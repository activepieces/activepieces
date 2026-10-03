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
    const createdAfter =
      lastFetchEpochMS === 0
        ? dayjs().subtract(1, 'day').valueOf()
        : lastFetchEpochMS;
    const createdUpTo = await findWindowEnd({
      client,
      datasheetId: datasheet_id,
      createdAfter,
      createdUpTo: dayjs().valueOf(),
    });
    const records = await listRecordsCreatedBetween({
      client,
      datasheetId: datasheet_id,
      createdAfter,
      createdUpTo,
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

async function findWindowEnd({
  client,
  datasheetId,
  createdAfter,
  createdUpTo,
}: CreatedWindow & DatasheetTarget): Promise<number> {
  const total = await countCreatedBetween({
    client,
    datasheetId,
    createdAfter,
    createdUpTo,
  });
  if (total <= MAX_RECORDS_PER_POLL) {
    return createdUpTo;
  }
  return bisectWindowEnd({
    client,
    datasheetId,
    createdAfter,
    fitsUpTo: createdAfter,
    fitsCount: 0,
    overflowsAt: createdUpTo,
  });
}

async function bisectWindowEnd({
  client,
  datasheetId,
  createdAfter,
  fitsUpTo,
  fitsCount,
  overflowsAt,
}: DatasheetTarget & {
  createdAfter: number;
  fitsUpTo: number;
  fitsCount: number;
  overflowsAt: number;
}): Promise<number> {
  if (overflowsAt - fitsUpTo <= 1) {
    return fitsCount > 0 ? fitsUpTo : overflowsAt;
  }
  const middle = fitsUpTo + Math.floor((overflowsAt - fitsUpTo) / 2);
  const count = await countCreatedBetween({
    client,
    datasheetId,
    createdAfter,
    createdUpTo: middle,
  });
  if (count <= MAX_RECORDS_PER_POLL) {
    return bisectWindowEnd({
      client,
      datasheetId,
      createdAfter,
      fitsUpTo: middle,
      fitsCount: count,
      overflowsAt,
    });
  }
  return bisectWindowEnd({
    client,
    datasheetId,
    createdAfter,
    fitsUpTo,
    fitsCount,
    overflowsAt: middle,
  });
}

async function countCreatedBetween({
  client,
  datasheetId,
  createdAfter,
  createdUpTo,
}: CreatedWindow & DatasheetTarget): Promise<number> {
  const probe = await client.listRecords(datasheetId, {
    pageSize: '1',
    filterByFormula: createdBetween({ createdAfter, createdUpTo }),
  });
  return probe.data.total;
}

async function listRecordsCreatedBetween({
  client,
  datasheetId,
  createdAfter,
  createdUpTo,
  pageNum,
}: CreatedWindow &
  DatasheetTarget & {
    pageNum: number;
  }): Promise<ListedRecord[]> {
  const page = await client.listRecords(datasheetId, {
    pageSize: String(PAGE_SIZE),
    pageNum: String(pageNum),
    filterByFormula: createdBetween({ createdAfter, createdUpTo }),
  });
  const records = page.data.records;
  const fetchedSoFar = (pageNum - 1) * PAGE_SIZE + records.length;
  if (records.length === 0 || fetchedSoFar >= page.data.total) {
    return records;
  }
  const nextPages = await listRecordsCreatedBetween({
    client,
    datasheetId,
    createdAfter,
    createdUpTo,
    pageNum: pageNum + 1,
  });
  return [...records, ...nextPages];
}

function createdBetween({ createdAfter, createdUpTo }: CreatedWindow): string {
  return `AND(CREATED_TIME() > ${createdAfter}, CREATED_TIME() <= ${createdUpTo})`;
}

const PAGE_SIZE = 1000;
const MAX_RECORDS_PER_POLL = 5000;

type CreatedWindow = {
  createdAfter: number;
  createdUpTo: number;
};

type DatasheetTarget = {
  client: AITableClient;
  datasheetId: string;
};

type ListedRecord = Awaited<
  ReturnType<AITableClient['listRecords']>
>['data']['records'][number];
