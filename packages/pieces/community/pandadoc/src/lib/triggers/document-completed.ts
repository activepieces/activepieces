import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { folderFilterDropdown, templateFilterDropdown } from '../common/dynamic-dropdowns';
import { pandadocSchemas } from '../common/schemas';
import { pandadocWebhook } from '../common/webhook';
import { pandadocSampleEvent } from './sample-data';

export const documentCompleted = createTrigger({
  auth: pandadocAuth,
  name: 'documentCompleted',
  classification: 'READ',
  displayName: 'Document Completed',
  description: 'Triggers when a document is completed (all recipients have signed or approved).',
  aiMetadata: {
    description:
      'Fires once when a PandaDoc document reaches the completed status, meaning every recipient has finished. Optionally limited to documents from specific templates or in specific folders. Delivers the full document with recipients, fields and metadata.',
  },
  props: {
    template_filter: templateFilterDropdown,
    folder_filter: folderFilterDropdown,
  },
  sampleData: { ...pandadocSampleEvent, status: 'document.completed' },
  outputSchema: pandadocSchemas['webhookEvent'],
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await pandadocWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      name: 'Document Completed',
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
          items: items.filter((item) => item.status === 'document.completed'),
          templateIds: context.propsValue.template_filter,
          folderIds: context.propsValue.folder_filter,
        }),
    });
  },
});

const EVENTS = ['document_state_changed'];
const STORE_KEY = 'pandadoc_document_completed_webhook';
