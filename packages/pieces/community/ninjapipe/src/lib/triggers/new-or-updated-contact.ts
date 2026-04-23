import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newOrUpdatedContact = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_contact',
  displayName: 'New or Updated Contact',
  description: 'Triggers when a contact is created or updated.',
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
