import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { notionCommon } from '../common';
import { notionDatabasePolling } from '../common/database-polling';
import { notionAuth } from '../auth';
import { updatedDatabaseItemTriggerOutputSchema } from '../output-schemas';

export const updatedDatabaseItem = createTrigger({
  auth: notionAuth,
  name: 'updated_database_item',
  classification: 'READ',
  displayName: 'Updated Database Item',
  description: 'Triggers when an item is updated in a database.',
  aiMetadata: {
    description:
      'Fires when an existing item in the selected Notion database is edited (any property change), emitting the updated page. Use to react to record changes such as status or field updates in a specific database.',
  },
  props: {
    database_id: notionCommon.database_id,
  },
  outputSchema: updatedDatabaseItemTriggerOutputSchema,
  sampleData: {
    object: 'page',
    id: '1a9fa248-94e2-80a7-aba9-d7200621a1ef',
    title: 'fIX ERROR',
    property_values: {
      Status: 'To Do',
      Priority: 'Medium',
      DueDate: '2025-02-28',
      Name: 'fIX ERROR',
    },
    url: 'https://app.notion.com/p/fIX-ERROR-1a9fa24894e280a7aba9d7200621a1ef',
    public_url: null,
    created_time: '2025-03-01T13:33:00.000Z',
    last_edited_time: '2025-03-01T13:33:00.000Z',
    created_by: {
      object: 'user',
      id: 'eb85488e-97f8-46d2-85fa-49b87bc1037d',
    },
    last_edited_by: {
      object: 'user',
      id: 'eb85488e-97f8-46d2-85fa-49b87bc1037d',
    },
    cover: null,
    icon: null,
    parent: {
      type: 'database_id',
      database_id: '1a9fa248-94e2-81bc-837e-d26e876ba6c0',
    },
    in_trash: false,
    is_archived: false,
    is_locked: false,
    archived: false,
    properties: {
      Status: {
        id: 'H%40%5Bv',
        type: 'select',
        select: {
          id: 'ff441c13-5498-4922-b7b1-0530e7381857',
          name: 'To Do',
          color: 'red',
        },
      },
      Priority: {
        id: 'H%7C%7D%3F',
        type: 'select',
        select: {
          id: 'fd99439b-915e-4cf4-9e1d-39108768e3da',
          name: 'Medium',
          color: 'yellow',
        },
      },
      DueDate: {
        id: 'XsW%7C',
        type: 'date',
        date: {
          start: '2025-02-28',
          end: null,
          time_zone: null,
        },
      },
      Name: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: 'fIX ERROR ',
              link: null,
            },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
            plain_text: 'fIX ERROR ',
            href: null,
          },
        ],
      },
    },
  },

  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return notionDatabasePolling.sample({
      auth: ctx.auth,
      databaseId: ctx.propsValue.database_id!,
      timestamp: 'last_edited_time',
    });
  },
  async onEnable(ctx) {
    await notionDatabasePolling.enable({
      auth: ctx.auth,
      store: ctx.store,
      databaseId: ctx.propsValue.database_id!,
      timestamp: 'last_edited_time',
      isRepublish: ctx.isRepublish,
    });
  },
  async onDisable() {
    return;
  },
  async run(ctx) {
    return notionDatabasePolling.poll({
      auth: ctx.auth,
      store: ctx.store,
      databaseId: ctx.propsValue.database_id!,
      timestamp: 'last_edited_time',
    });
  },
});
