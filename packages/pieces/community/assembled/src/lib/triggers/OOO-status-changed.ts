import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const timeOffStatusChanged = createTrigger({
  name: 'OOO_status_changed',
  displayName: 'OOO Status Changed',
  description: 'Triggers on approval/rejection of OOO.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: '<uuid>',
    time_off_request_id: '<uuid>',
    created_at: 1546303260,
    comment: 'Enjoy your vacation',
    type: 'approve',
    time_off_request: {
      id: '<uuid>',
      agent_id: '<uuid>',
      start_time: 1546303260,
      end_time: 1546303270,
      created_at: 1546303260,
      description: 'Going to the dentist',
      status: 'approved',
      activity_type_id: '<uuid>'
    }
  },
  async onEnable(context: any) {
    await context.store.put('lastStatusCheck', Math.floor(Date.now() / 1000));
  },
  async onDisable() {
    // No cleanup needed
  },
  async run(context: any) {
    const lastCheck = await context.store.get('lastStatusCheck') || Math.floor(Date.now() / 1000) - 86400; // 24 hours ago in Unix timestamp
    
    const response = await assembledCommon.makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/time_off/updates?updated_since=${lastCheck}&type=approve`
    );
    
    // Handle the documented response structure
    const timeOffUpdates = response.body.time_off_updates || {};
    const timeOffRequests = response.body.time_off_requests || {};
    
    // Transform the response to include both update and request data
    const statusChanges = Object.values(timeOffUpdates).map((update: any) => {
      const request = timeOffRequests[update.time_off_request_id];
      return {
        ...update,
        time_off_request: request
      };
    });
    
    if (statusChanges.length > 0) {
      await context.store.put('lastStatusCheck', Math.floor(Date.now() / 1000));
    }
    
    return statusChanges;
  },
});