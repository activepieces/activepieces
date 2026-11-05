import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkWebhook } from '../common/webhook';
import { folkOutputSchemas } from '../output-schemas';

export const companyCustomFieldUpdated = createTrigger({
  auth: folkAuth,
  name: 'company_custom_field_updated',
  classification: 'READ',
  displayName: 'Company Groups Updated',
  description:
    "Fires when a company's group assignments are updated in your Folk workspace.",
  aiMetadata: {
    description: "Fires when a company's group memberships change in the connected Folk workspace (added to or removed from groups). The event payload carries the company ID and the list of group additions and removals. Deliveries are signature-checked and retried deliveries are de-duplicated.",
  },
  props: {},
  sampleData: {
    id: 'evt_6004f2ef-dcc3-4c56-a704-9326730ad100',
    type: 'company.groups_updated',
    createdAt: '2025-09-30T09:55:52.715Z',
    source:
      'https://api.folk.app/v1/webhooks/wbk_2f15ec4f-0f70-4884-a43d-1f88ef7a6665',
    data: {
      id: 'com_05837e2d-9bf7-4f17-8729-e95f1be4de67',
      url: 'https://api.folk.app/v1/companies/com_05837e2d-9bf7-4f17-8729-e95f1be4de67',
      changes: [
        {
          path: ['groups'],
          type: 'add',
          value: [{ id: 'grp_bc984b3f-0386-434d-82d7-a91eb6badd71' }],
        },
        {
          path: ['groups'],
          type: 'remove',
          value: [{ id: 'grp_3b7d7b65-4c2d-4b65-822a-6bc759e1e951' }],
        },
      ],
    },
  },
  outputSchema: folkOutputSchemas.webhookEvent,
  type: TriggerStrategy.WEBHOOK,

  ...folkWebhook.handlers({ eventType: 'company.groups_updated', label: 'Company Groups Updated' }),
});
