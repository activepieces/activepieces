import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newTimeOffRequest = createTrigger({
  name: 'new_OOO_request',
  displayName: 'New OOO Request',
  description: 'Triggers when a new OOO request is created.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: '<uuid>',
    agent_id: '<uuid>',
    start_time: 1546303260,
    end_time: 1546303270,
    created_at: 1546303260,
    description: 'Going to the dentist',
    status: 'approved',
    activity_type_id: '<uuid>',
  },
  async onEnable(context: any) {
    await context.store.put('lastCheck', Math.floor(Date.now() / 1000));
  },
  async onDisable() {
    // Cleanup if needed
  },
  async run(context: any) {
    const lastCheck = await context.store.get('lastCheck') || Math.floor(Date.now() / 1000) - 86400; 
    
    const response = await assembledCommon.makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/time_off/requests?updated_since=${lastCheck}&limit=100`
    );
    
    // Handle the documented response structure
    const timeOffRequests = response.body.time_off_requests || {};
    const newRequests = Object.values(timeOffRequests);
    
    if (newRequests.length > 0) {
      await context.store.put('lastCheck', Math.floor(Date.now() / 1000));
    }
    
    return newRequests;
  },
});