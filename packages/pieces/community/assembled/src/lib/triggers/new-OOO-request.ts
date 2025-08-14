import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newTimeOffRequest = createTrigger({
  name: 'new_OOO_request',
  displayName: 'New OOO Request',
  description: 'Triggers when a new OOO request is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 'req_123',
    user_id: 'user_456',
    start_date: '2025-01-20',
    end_date: '2025-01-22',
    status: 'pending',
    event_type: 'PTO',
    created_at: '2025-01-15T10:00:00Z',
  },
  async onEnable(context) {
    await context.store.put('lastCheck', new Date().toISOString());
  },
  async onDisable(context) {
    // Cleanup if needed
  },
  async run(context) {
    const lastCheck = await context.store.get('lastCheck') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const response = await assembledCommon.makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/time-off-requests?created_after=${lastCheck}&limit=100`
    );
    
    const newRequests = response.body.data || [];
    
    if (newRequests.length > 0) {
      await context.store.put('lastCheck', new Date().toISOString());
    }
    
    return newRequests;
  },
});