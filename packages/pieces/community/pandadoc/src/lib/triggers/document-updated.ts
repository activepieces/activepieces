import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { folderFilterDropdown, templateFilterDropdown } from '../common/dynamic-dropdowns';
import { pandadocSchemas } from '../common/schemas';
import { pandadocWebhook } from '../common/webhook';
import { pandadocSampleEvent } from './sample-data';

export const documentUpdated = createTrigger({
  auth: pandadocAuth,
  name: 'documentUpdated',
  classification: 'READ',
  displayName: 'Document Updated',
  description: 'Triggers when a sent document is moved back to draft so it can be edited.',
  aiMetadata: {
    description:
      'Fires when PandaDoc reports a document_updated event, which happens when a sent document is returned to draft for editing. Optionally limited to documents from specific templates or in specific folders. Delivers the document with recipients, fields and metadata.',
  },
  props: {
    template_filter: templateFilterDropdown,
    folder_filter: folderFilterDropdown,
    update_type_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Update Type (no longer used)',
      description: 'PandaDoc does not report which part of a document changed, so this filter is ignored. Leave it empty.',
      required: false,
      options: {
        options: [
          { label: 'Content Changes', value: 'content' },
          { label: 'Recipient Changes', value: 'recipients' },
          { label: 'Settings Changes', value: 'settings' },
          { label: 'Status Changes', value: 'status' },
          { label: 'Field Changes', value: 'fields' },
          { label: 'Name Changes', value: 'name' },
          { label: 'Metadata Changes', value: 'metadata' },
        ],
      },
    }),
  },
  sampleData: { ...pandadocSampleEvent, event: 'document_updated', status: 'document.draft', date_completed: null },
  outputSchema: pandadocSchemas['webhookEvent'],
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await pandadocWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      name: 'Document Updated',
      events: EVENTS,
      store: context.store,
      storeKey: STORE_KEY,
    });
  },
  async onDisable(context) {
    await pandadocWebhook.unsubscribe({ apiKey: context.auth.secret_text, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    return pandadocWebhook.receive({
      payload: context.payload,
      store: context.store,
      storeKey: STORE_KEY,
      events: EVENTS,
      select: (items) =>
        pandadocWebhook.filterItems({
          apiKey: context.auth.secret_text,
          items,
          templateIds: context.propsValue.template_filter,
          folderIds: context.propsValue.folder_filter,
        }),
    });
  },
});

const EVENTS = ['document_updated'];
const STORE_KEY = 'pandadoc_document_updated_webhook';
