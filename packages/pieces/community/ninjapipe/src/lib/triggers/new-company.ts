import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { buildPolling } from './common';

export const newCompany = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_company',
  displayName: 'New Company',
  description: 'Triggers when a new company is created.',
  aiMetadata: {
    description: 'Fires once for each company newly created in NinjaPipe, detected by polling on the company creation timestamp. The event payload is the created company, including its id, name, and created_at. Use it to react to brand-new companies; it does not fire when an existing company is later updated.',
  },
  type: TriggerStrategy.POLLING,
  sampleData: { id: '1', name: 'Acme Inc', created_at: '2024-01-01T00:00:00Z' },
  props: {},
  async test(context) {
    return await pollingHelper.test(buildPolling('/companies', 'created_at'), context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(buildPolling('/companies', 'created_at'), context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(buildPolling('/companies', 'created_at'), context);
  },
  async run(context) {
    return await pollingHelper.poll(buildPolling('/companies', 'created_at'), context);
  },
});
