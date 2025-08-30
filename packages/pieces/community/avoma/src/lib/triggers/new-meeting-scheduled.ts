import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { avomaAuth } from '../../index';
import { createAvomaClient } from '../common';

export const newMeetingScheduledTrigger = createTrigger({
  auth: avomaAuth,
  name: 'new_meeting_scheduled',
  displayName: 'New Meeting Scheduled',
  description: 'Triggers when a meeting is booked via Avoma scheduling pages',
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
      const newMeetings = meetings.filter(meeting => 
        meeting.status === 'scheduled' && 
        (!lastCheck || new Date(meeting.created_at) > new Date(lastCheck))
      );

      if (newMeetings.length > 0) {
        await context.store?.put('lastCheck', new Date().toISOString());
      }

      return newMeetings.map(meeting => ({
        id: meeting.meeting_uuid,
        data: meeting,
      }));
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  },
  test: async (context) => {
    const client = createAvomaClient(context.auth);
    
    try {
      const meetings = await client.getMeetings();
      return meetings
        .filter(meeting => meeting.status === 'scheduled')
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