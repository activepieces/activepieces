import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newContact = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created.',
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', email: 'example@ninjapipe.app', first_name: 'Jane', last_name: 'Doe', created_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/contacts', 'created_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/contacts', 'created_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/contacts', 'created_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/contacts', 'created_at'), context);
  },
});
