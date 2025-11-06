import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const scheduleUpdated = createTrigger({
  name: 'schedule_updated',
  displayName: 'Schedule Updated',
  description: 'Triggers when user schedule is modified.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    user_id: 'user_456',
    schedule_id: 'sched_123',
    changes: ['shift_added', 'shift_modified'],
    updated_at: '2025-01-15T10:00:00Z',
  },
  async onEnable(context) {
    await context.store.put('lastScheduleCheck', new Date().toISOString());
  },
  async onDisable() {
    // Cleanup if needed
  },
  async run(context) {
    const lastCheck = await context.store.get('lastScheduleCheck') || new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const response = await assembledCommon.makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/events?type=schedule_updated&after=${lastCheck}&limit=100`
    );
    
    const scheduleUpdates = response.body.data || [];
    
    if (scheduleUpdates.length > 0) {
      await context.store.put('lastScheduleCheck', new Date().toISOString());
    }
    
    return scheduleUpdates;
  },
});