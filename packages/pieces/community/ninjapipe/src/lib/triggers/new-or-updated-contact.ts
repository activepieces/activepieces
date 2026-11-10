import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../auth';
import { ninjapipeSchemas } from '../output-schemas';
import { ninjapipePolling } from './common';

const polling = ninjapipePolling.buildPolling({ path: '/contacts', field: 'updated_at' });

export const newOrUpdatedContact = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_contact',
  classification: 'READ',
  displayName: 'New or Updated Contact',
  description: 'Triggers when a contact is created or updated.',
  aiMetadata: {
    description:
      'Fires whenever a NinjaPipe contact is created or changed, found by polling contacts sorted by updated_at. The payload is the current contact record. One contact can fire many times; the payload does not say whether it was a create or an update.',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: ninjapipeSchemas.contact,
  sampleData: {
    id: '8bd9d1d9-4e0e-4606-aad9-bcb198b17d26',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: '+15550001',
    status: 'Active',
    owner_id: '01a55c1c-96af-4a4f-879b-e317def0769a',
    assigned_to: null,
    company_id: null,
    slug: 'jane-doe',
    fields: {},
    created_at: '2026-10-25T15:33:09.636647+00:00',
    updated_at: '2026-10-25T15:36:51.542+00:00',
  },
  props: {},
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
