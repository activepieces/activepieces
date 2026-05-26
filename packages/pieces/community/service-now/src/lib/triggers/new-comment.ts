import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  servicenowAuth,
  tableDropdown,
  createServiceNowClient,
} from '../common/props';
import { JOURNAL_ELEMENT, JOURNAL_ELEMENT_FILTER } from '../common/journal';

type CommentTriggerProps = {
  table: string;
  entry_type: string;
  record_sys_id?: string;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof servicenowAuth>,
  CommentTriggerProps
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const client = createServiceNowClient(auth);
    const { table, entry_type, record_sys_id } = propsValue;

    const elements: string[] =
      entry_type === JOURNAL_ELEMENT_FILTER.BOTH || !entry_type
        ? [JOURNAL_ELEMENT.COMMENTS, JOURNAL_ELEMENT.WORK_NOTES]
        : [entry_type];

    const entries = await client.pollJournalEntries({
      table,
      elements,
      record_sys_id,
      limit: 100,
    });

    return entries.map((entry) => ({
      id: entry.sys_id,
      data: entry,
    }));
  },
};

export const newCommentTrigger = createTrigger({
  auth: servicenowAuth,
  name: 'new_comment',
  displayName: 'New Comment or Work Note',
  description:
    'Triggers when a new comment or work note is added to a record in the selected table',
  type: TriggerStrategy.POLLING,
  props: {
    table: tableDropdown,
    entry_type: Property.StaticDropdown({
      displayName: 'Entry Type',
      description: 'Which journal entries to watch',
      required: true,
      defaultValue: JOURNAL_ELEMENT_FILTER.BOTH,
      options: {
        disabled: false,
        options: [
          { label: 'Comments and Work Notes', value: JOURNAL_ELEMENT_FILTER.BOTH },
          { label: 'Customer-visible Comments only', value: JOURNAL_ELEMENT.COMMENTS },
          { label: 'Internal Work Notes only', value: JOURNAL_ELEMENT.WORK_NOTES },
        ],
      },
    }),
    record_sys_id: Property.ShortText({
      displayName: 'Record Sys ID Filter (optional)',
      description:
        'If set, only fire for comments on this specific record sys_id',
      required: false,
    }),
  },
  sampleData: {
    sys_id: 'sample_journal_sys_id',
    element: 'comments',
    element_id: 'sample_record_sys_id',
    name: 'incident',
    value: 'New comment text',
    sys_created_by: 'admin',
    sys_created_on: '2026-04-30 12:00:00',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
