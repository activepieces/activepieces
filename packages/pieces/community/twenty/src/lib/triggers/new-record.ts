import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { twentyAuth } from '../auth';
import { twentyRecordProps } from '../common/record-props';
import { twentyApi } from '../common/api';
import { twentyMetadataUtils } from '../common/metadata';

const props = { object: twentyRecordProps.object({ required: true }) };
const polling: Polling<
  AppConnectionValueForAuthProperty<typeof twentyAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const object = propsValue.object;

    if (!twentyMetadataUtils.isObjectRef(object))
      throw new Error('Select an object.');
    const items = (
      await twentyApi.listRecords({
        auth,
        objectNamePlural: object.namePlural,
        orderBy: 'createdAt[AscNullsLast]',
        filter: `createdAt[gt]:"${new Date(lastFetchEpochMS).toISOString()}"`,
        limit: 100,
      })
    ).records;
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.createdAt).valueOf(),
      data: item,
    }));
  },
};

export const newRecordTrigger = createTrigger({
  auth: twentyAuth,
  name: 'new_record',
  displayName: 'New Record',
  classification: 'READ',
  description:
    'Triggers when a new record of the selected object is created in Twenty CRM.',
  aiMetadata: {
    description:
      'Fires when a new record of the selected object (people, companies, opportunities or a custom object) is created in the connected Twenty CRM workspace. Polls for records by their creation time and emits one event per new record with its field values at the time of the poll. Edits to existing records do not fire it; use Updated Record for those.',
  },
  props,
  sampleData: {
    id: '20202020-1c25-4d02-bf25-6aeccf7ea419',
    name: { firstName: 'Alice', lastName: 'Doe' },
    emails: { primaryEmail: 'alice@example.com', additionalEmails: [] },
    jobTitle: 'Account Manager',
    position: 1,
    createdBy: {
      source: 'MANUAL',
      name: 'Jane Smith',
      workspaceMemberId: '20202020-0687-4c41-b707-ed1bfca972a7',
    },
    updatedBy: {
      source: 'MANUAL',
      name: 'Jane Smith',
      workspaceMemberId: '20202020-0687-4c41-b707-ed1bfca972a7',
    },
    createdAt: '2026-11-02T10:15:30.000Z',
    updatedAt: '2026-11-02T10:15:30.000Z',
    deletedAt: null,
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
