import { pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesPolling } from '../common/record-polling';
import { contactOutputSchema } from '../output-schemas';

export const updatedContact = createTrigger({
  auth: freshsalesAuth,
  name: 'updated_contact',
  displayName: 'Updated Contact',
  description: 'Triggers when a contact is created or updated',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when a Freshsales contact is updated (new contacts also count as an update). Polls the All contacts view sorted by update time; each event is the contact as it is now.',
  },
  outputSchema: contactOutputSchema,
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  sampleData: {
    id: 16000123456,
    first_name: 'Jane',
    last_name: 'Doe',
    display_name: 'Jane Doe',
    email: 'jane@acme.com',
    emails: [{ id: 1, value: 'jane@acme.com', is_primary: true }],
    mobile_number: '+15550100',
    work_number: null,
    job_title: 'CTO',
    city: 'Austin',
    country: 'USA',
    owner_id: 16000000001,
    territory_id: null,
    contact_status_id: 16000000010,
    lifecycle_stage_id: 16000000020,
    sales_account_id: 16000000100,
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:05:00Z',
    custom_field: { cf_plan: 'Pro' },
  },
});

const polling = freshsalesPolling.buildPolling({
  entity: 'contacts',
  timestampField: 'updated_at',
});
