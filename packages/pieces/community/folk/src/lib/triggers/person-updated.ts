import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkProps } from '../common/props';
import { folkWebhook } from '../common/webhook';
import { folkOutputSchemas } from '../output-schemas';

export const personUpdated = createTrigger({
  auth: folkAuth,
  name: 'person_updated',
  classification: 'READ',
  displayName: 'Person Updated',
  description: 'Fires when a person is updated in your Folk workspace.',
  aiMetadata: {
    description: 'Fires when an existing person (contact) is modified in the connected Folk workspace, optionally scoped to a single group. The event payload carries the person ID and a list of field-level changes (including company links and custom field values) describing what was set, added, or removed. Deliveries are signature-checked and retried deliveries are de-duplicated.',
  },
  props: {
    groupId: folkProps.group_id(false, 'Group ID'),
  },
  sampleData: {
    id: 'evt_6004f2ef-dcc3-4c56-a704-9326730ad100',
    type: 'person.updated',
    createdAt: '2025-09-30T09:55:52.715Z',
    source:
      'https://api.folk.app/v1/webhooks/wbk_2f15ec4f-0f70-4884-a43d-1f88ef7a6665',
    data: {
      id: 'per_05837e2d-9bf7-4f17-8729-e95f1be4de67',
      url: 'https://api.folk.app/v1/people/per_05837e2d-9bf7-4f17-8729-e95f1be4de67',
      changes: [
        {
          path: ['firstName'],
          type: 'set',
          value: 'John',
        },
        {
          path: ['description'],
          type: 'set',
        },
        {
          path: ['companies'],
          type: 'add',
          value: [{ id: 'com_3b7d7b65-4c2d-4b65-822a-6bc759e1e951' }],
        },
        {
          path: [
            'customFieldValues',
            'grp_bc984b3f-0386-434d-82d7-a91eb6badd71',
            'Status',
          ],
          type: 'set',
          value: 'In Progress',
        },
        {
          path: [
            'customFieldValues',
            'grp_bc984b3f-0386-434d-82d7-a91eb6badd71',
            'Tags',
          ],
          type: 'remove',
          value: ['VIP'],
        },
        {
          path: [
            'customFieldValues',
            'grp_bc984b3f-0386-434d-82d7-a91eb6badd71',
            'Assigned to',
          ],
          type: 'add',
          value: [{ id: 'usr_3b7d7b65-4c2d-4b65-822a-6bc759e1e951' }],
        },
      ],
    },
  },
  outputSchema: folkOutputSchemas.webhookEvent,
  type: TriggerStrategy.WEBHOOK,

  ...folkWebhook.handlers({ eventType: 'person.updated', label: 'Person Updated' }),
});
