import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkProps } from '../common/props';
import { folkWebhook } from '../common/webhook';
import { folkOutputSchemas } from '../output-schemas';

export const personRemoved = createTrigger({
  auth: folkAuth,
  name: 'person_removed',
  classification: 'READ',
  displayName: 'Person Removed',
  description: 'Fires when a person is removed from your Folk workspace.',
  aiMetadata: {
    description: 'Fires when a person (contact) is deleted from the connected Folk workspace, optionally scoped to a single group. The event payload carries the deleted person ID along with a snapshot of their name and emails. Deliveries are signature-checked and retried deliveries are de-duplicated.',
  },
  props: {
    groupId: folkProps.group_id(false, 'Group ID'),
  },
  sampleData: {
    id: 'evt_6004f2ef-dcc3-4c56-a704-9326730ad100',
    type: 'person.deleted',
    createdAt: '2025-09-30T09:55:52.715Z',
    source:
      'https://api.folk.app/v1/webhooks/wbk_2f15ec4f-0f70-4884-a43d-1f88ef7a6665',
    data: {
      id: 'per_05837e2d-9bf7-4f17-8729-e95f1be4de67',
      url: 'https://api.folk.app/v1/people/per_05837e2d-9bf7-4f17-8729-e95f1be4de67',
      details: {
        name: 'John Doe',
        emails: ['john@doe.com'],
      },
    },
  },
  outputSchema: folkOutputSchemas.webhookEvent,
  type: TriggerStrategy.WEBHOOK,

  ...folkWebhook.handlers({ eventType: 'person.deleted', label: 'Person Removed' }),
});
