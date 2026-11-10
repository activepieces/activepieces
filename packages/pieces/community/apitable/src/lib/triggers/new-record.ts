import { APITableAuth } from '../auth';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
  isNil,
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
    const createdAfter = lastFetchEpochMS;
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
  propertyGroups: [
    {
      key: 'location',
      display: 'section',
      label: 'Location',
      icon: 'location',
      props: ['space_id', 'datasheet_id'],
    },
  ],
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
    return await listNewestRecords({
      client: makeClient(context.auth.props),
      datasheetId: context.propsValue.datasheet_id,
    });
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

async function listNewestRecords({
  client,
  datasheetId,
}: DatasheetTarget): Promise<ListedRecord[]> {
  const now = dayjs().valueOf();
  for (const days of [...SAMPLE_WINDOWS_DAYS, null]) {
    const filterByFormula = isNil(days)
      ? undefined
      : createdBetween({
          createdAfter: dayjs(now).subtract(days, 'day').valueOf(),
          createdUpTo: now,
        });
    const probe = await client.listRecords(datasheetId, {
      pageSize: '1',
      ...(filterByFormula ? { filterByFormula } : {}),
    });
    const total = probe.data.total;
    if (total >= SAMPLE_SIZE || isNil(days)) {
      const records = await listTail({ client, datasheetId, filterByFormula, total });
      return [...records]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, SAMPLE_SIZE)
        .reverse();
    }
  }
  return [];
}

async function listTail({
  client,
  datasheetId,
  filterByFormula,
  total,
}: DatasheetTarget & {
  filterByFormula: string | undefined;
  total: number;
}): Promise<ListedRecord[]> {
  if (total === 0) {
    return [];
  }
  const lastPage = Math.ceil(total / PAGE_SIZE);
  const pages = lastPage > 1 && total % PAGE_SIZE < SAMPLE_SIZE && total % PAGE_SIZE !== 0
    ? [lastPage - 1, lastPage]
    : [lastPage];
  const results = await Promise.all(
    pages.map((pageNum) =>
      client.listRecords(datasheetId, {
        pageSize: String(PAGE_SIZE),
        pageNum: String(pageNum),
        ...(filterByFormula ? { filterByFormula } : {}),
      })
    )
  );
  return results.flatMap((page) => page.data.records);
}

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
const SAMPLE_SIZE = 5;
const SAMPLE_WINDOWS_DAYS = [1, 7, 30, 365];
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
