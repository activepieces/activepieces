import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const timeOffStatusChanged = createTrigger({
  name: 'OOO_status_changed',
  displayName: 'OOO Status Changed',
  description: 'Triggers on approval/rejection of OOO',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 'req_123',
    user_id: 'user_456',
    status: 'approved',
    previous_status: 'pending',
    updated_at: '2025-01-15T10:00:00Z',
  },
  async onEnable(context) {
    await context.store.put('lastStatusCheck', new Date().toISOString());
  },
  async onDisable(context) {

  },
  async run(context) {
    const lastCheck = await context.store.get('lastStatusCheck') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const response = await assembledCommon.makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/OOO-requests?status_changed_after=${lastCheck}&limit=100`
    );
    
    const statusChanges = response.body.data || [];
    
    if (statusChanges.length > 0) {
      await context.store.put('lastStatusCheck', new Date().toISOString());
    }
    
    return statusChanges;
  },
});