import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { avomaAuth } from '../../index';
import { createAvomaClient } from '../common';

export const meetingRescheduledTrigger = createTrigger({
  auth: avomaAuth,
  name: 'meeting_rescheduled',
  displayName: 'Meeting Rescheduled',
  description: 'Triggers when a scheduled meeting is rescheduled',
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
      const rescheduledMeetings = meetings.filter(meeting => 
        meeting.status === 'rescheduled' && 
        (!lastCheck || new Date(meeting.updated_at) > new Date(lastCheck))
      );

      if (rescheduledMeetings.length > 0) {
        await context.store?.put('lastCheck', new Date().toISOString());
      }

      return rescheduledMeetings.map(meeting => ({
        id: meeting.meeting_uuid,
        data: meeting,
      }));
    } catch (error) {
      console.error('Error fetching rescheduled meetings:', error);
      return [];
    }
  },
  test: async (context) => {
    const client = createAvomaClient(context.auth);
    
    try {
      const meetings = await client.getMeetings();
      return meetings
        .filter(meeting => meeting.status === 'rescheduled')
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