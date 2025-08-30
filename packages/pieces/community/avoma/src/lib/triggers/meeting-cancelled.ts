import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { avomaAuth } from '../../index';
import { createAvomaClient } from '../common';

export const meetingCancelledTrigger = createTrigger({
  auth: avomaAuth,
  name: 'meeting_cancelled',
  displayName: 'Meeting Cancelled',
  description: 'Triggers when a meeting booked via scheduling page is canceled',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await context.store?.put('lastCheck', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store?.delete('lastCheck');
  },
  run: async (context) => {
    const client = createAvomaClient(context.auth);
    const lastCheck = await context.store?.get('lastCheck') as string;
    
    try {
      const meetings = await client.getMeetings(lastCheck);
      const cancelledMeetings = meetings.filter(meeting => 
        meeting.status === 'cancelled' && 
        (!lastCheck || new Date(meeting.updated_at) > new Date(lastCheck))
      );

      if (cancelledMeetings.length > 0) {
        await context.store?.put('lastCheck', new Date().toISOString());
      }

      return cancelledMeetings.map(meeting => ({
        id: meeting.meeting_uuid,
        data: meeting,
      }));
    } catch (error) {
      console.error('Error fetching cancelled meetings:', error);
      return [];
    }
  },
  test: async (context) => {
    const client = createAvomaClient(context.auth);
    
    try {
      const meetings = await client.getMeetings();
      return meetings
        .filter(meeting => meeting.status === 'cancelled')
        .slice(0, 3)
        .map(meeting => ({
          id: meeting.meeting_uuid,
          data: meeting,
        }));
    } catch (error) {
      return [];
    }
  },
});