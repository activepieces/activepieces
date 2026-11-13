import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocSchemas } from '../common/schemas';
import { pandadocWebhook } from '../common/webhook';
import { pandadocSampleEvent } from './sample-data';

export const documentStateChanged = createTrigger({
  auth: pandadocAuth,
  name: 'documentStateChanged',
  classification: 'READ',
  displayName: 'Document State Changed',
  description: 'Triggers when a document status changes.',
  aiMetadata: {
    description:
      'Fires whenever a PandaDoc document changes status (for example draft, sent, viewed, completed, paid, voided or declined), optionally only for selected target statuses. Delivers the document with its new status, recipients, fields and metadata.',
  },
  props: {
    filter_status: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Status',
      description: 'Only trigger when the document moves into one of these statuses (leave empty for all).',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'document.draft' },
          { label: 'Sent', value: 'document.sent' },
          { label: 'Completed', value: 'document.completed' },
          { label: 'Uploaded', value: 'document.uploaded' },
          { label: 'Error', value: 'document.error' },
          { label: 'Viewed', value: 'document.viewed' },
          { label: 'Waiting Approval', value: 'document.waiting_approval' },
          { label: 'Approved', value: 'document.approved' },
          { label: 'Rejected', value: 'document.rejected' },
          { label: 'Waiting Pay', value: 'document.waiting_pay' },
          { label: 'Paid', value: 'document.paid' },
          { label: 'Voided', value: 'document.voided' },
          { label: 'Declined', value: 'document.declined' },
          { label: 'External Review', value: 'document.external_review' },
        ],
      },
    }),
  },
  sampleData: { ...pandadocSampleEvent, status: 'document.sent', date_completed: null },
  outputSchema: pandadocSchemas['webhookEvent'],
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await pandadocWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      name: 'Document State Changed',
      events: EVENTS,
      store: context.store,
      storeKey: STORE_KEY,
    });
  },
  async onDisable(context) {
    await pandadocWebhook.unsubscribe({ apiKey: context.auth.secret_text, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const statuses = context.propsValue.filter_status ?? [];
    return pandadocWebhook.receive({
      payload: context.payload,
      store: context.store,
      storeKey: STORE_KEY,
      events: EVENTS,
      select: (items) => items.filter((item) => statuses.length === 0 || (item.status !== null && statuses.includes(item.status))),
    });
  },
});

const EVENTS = ['document_state_changed'];
const STORE_KEY = 'pandadoc_document_state_changed_webhook';
