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
import { twentyAuth } from '../auth';
import { twentyRecordProps } from '../common/record-props';
import { twentyApi } from '../common/api';
import { twentyMetadataUtils } from '../common/metadata';
import { TwentyDiffCache } from '../common/types';
import { twentyTimelineUtils } from '../common/timeline';
import dayjs from 'dayjs';

const SETTLE_DELAY_MS = 30 * 1000;
const DIFF_CACHE_KEY = 'twenty_timeline_diff_cache';
const CURSOR_KEY = 'twenty_timeline_cursor';

const props = {
  object: twentyRecordProps.object({ required: true }),
  fields: twentyRecordProps.fields({
    required: false,
    displayName: 'Listen On',
    description:
      'Only trigger when one of these fields changes. Leave empty to trigger on any change.',
    purpose: 'write',
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof twentyAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS, store }) => {
    const object = propsValue.object;
    if (!twentyMetadataUtils.isObjectRef(object))
      throw new Error('Select an object.');

    const targetColumn = twentyMetadataUtils.createTargetColumn({
      nameSingular: object.nameSingular,
    });
    const trackedKeys = (propsValue.fields ?? [])
      .filter(twentyMetadataUtils.isFieldRef)
      .map((ref) => ref.key);

    const cache = (await store.get<TwentyDiffCache>(DIFF_CACHE_KEY)) ?? {};
    const cursor = Math.max(
      (await store.get<number>(CURSOR_KEY)) ?? 0,
      lastFetchEpochMS
    );
    const timelines = await twentyApi.listTimelines({
      auth,
      targetColumn,
      since: cursor,
      until: Date.now() - SETTLE_DELAY_MS,
    });
    await store.put(CURSOR_KEY, timelines.cursor);

    const activities =
      trackedKeys.length === 0
        ? timelines.activities
        : timelines.activities.flatMap((activity) => {
            const diff = Object.fromEntries(
              Object.entries(activity.diff).filter(([key]) =>
                trackedKeys.includes(key)
              )
            );

            return Object.keys(diff).length === 0
              ? []
              : [{ ...activity, diff }];
          });

    const changed = twentyTimelineUtils.findNewChanges({ activities, cache });
    await store.put(
      DIFF_CACHE_KEY,
      twentyTimelineUtils.nextDiffCache({ cache, changed, now: Date.now() })
    );
    const grouped = twentyTimelineUtils.groupChangesByRecord({ changed });

    const records = await twentyApi.getRecordsByIds({
      auth,
      objectNamePlural: object.namePlural,
      recordIds: [...grouped.keys()],
    });
    const recordsById = new Map(
      records.flatMap((record) =>
        typeof record.id === 'string' ? [[record.id, record]] : []
      )
    );
    return [...grouped].flatMap(
      ([recordId, { changes, workspaceMemberIds, updatedAt }]) => {
        const record = recordsById.get(recordId);
        if (record === undefined) return [];

        return [
          {
            epochMilliSeconds: dayjs(updatedAt).valueOf(),
            data: { record, changes, workspaceMemberIds },
          },
        ];
      }
    );
  },
};

export const updatedRecordTrigger = createTrigger({
  auth: twentyAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  classification: 'READ',
  description:
    'Triggers when fields of a record of the selected object change in Twenty CRM, with their old and new values.',
  aiMetadata: {
    description:
      'Fires when fields of an existing record of the selected object (people, companies, opportunities or a custom object) change in the connected Twenty CRM workspace, optionally only for the selected fields. Reads the workspace timeline, so the object must have audit logging enabled and the API key needs read access to every object and field. Emits one event per changed record with the current record, each changed field as before and after, and the workspace members who changed it; several changes to the same record between two polls arrive as one event. New records do not fire it; use New Record for those.',
  },
  props,
  propertyGroups: [
    {
      key: 'object',
      display: 'section',
      label: 'Object',
      icon: 'tag',
      props: ['object'],
    },
    {
      key: 'tracking',
      display: 'section',
      label: 'Fields',
      icon: 'filter',
      props: ['fields'],
    },
  ],
  sampleData: {
    record: {
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
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-11-02T10:15:30.000Z',
      deletedAt: null,
    },
    changes: {
      jobTitle: { before: 'Sales Representative', after: 'Account Manager' },
    },
    workspaceMemberIds: ['20202020-0687-4c41-b707-ed1bfca972a7'],
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    await context.store.delete(DIFF_CACHE_KEY);
    await context.store.delete(CURSOR_KEY);
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await context.store.delete(DIFF_CACHE_KEY);
    await context.store.delete(CURSOR_KEY);
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
