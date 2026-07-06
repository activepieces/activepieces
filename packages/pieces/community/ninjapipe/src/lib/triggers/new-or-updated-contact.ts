import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newOrUpdatedContact = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_contact',
  displayName: 'New or Updated Contact',
  description: 'Triggers when a contact is created or updated.',
  aiMetadata: {
    description: 'Fires whenever a contact in NinjaPipe is created or has any field changed, detected by polling on the contact last-updated timestamp. The event payload is the current state of the affected contact, including its id, email, first_name, last_name, and updated_at. A given contact can fire this multiple times as it is edited; the payload does not distinguish a first creation from a later update.',
  },
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', email: 'example@ninjapipe.app', first_name: 'Jane', last_name: 'Doe', updated_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/contacts', 'updated_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/contacts', 'updated_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/contacts', 'updated_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/contacts', 'updated_at'), context);
  },
});
