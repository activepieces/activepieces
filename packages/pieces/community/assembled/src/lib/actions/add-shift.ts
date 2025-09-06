import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addShift = createAction({
  name: 'add_shift',
  displayName: 'Add Shift on Assembled',
  description: 'Add a new shift to a user\'s schedule in Assembled',
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'Agent ID of the person to assign the shift to (use the agent_id field from /people endpoint, not the person id)',
      required: true,
    }),
    start_time: Property.DateTime({
      displayName: 'Start Time',
      description: 'Start time of the shift',
      required: true,
    }),
    end_time: Property.DateTime({
      displayName: 'End Time', 
      description: 'End time of the shift',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'Date of the shift',
      required: true,
    }),
    shift_type: Property.StaticDropdown({
      displayName: 'Shift Type',
      description: 'Type of shift',
      required: false,
      defaultValue: 'regular',
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Overtime', value: 'overtime' },
          { label: 'On-call', value: 'on_call' },
          { label: 'Training', value: 'training' },
        ],
      },
    }),
    activity_type_id: Property.ShortText({
      displayName: 'Activity Type ID',
      description: 'UUID of the activity type for this shift (get from /activity_types endpoint)',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes for the shift',
      required: false,
    }),
  },
  async run(context) {
    const { agent_id, start_time, end_time, date, shift_type, activity_type_id, notes } = context.propsValue;
    
    try {
      // Convert to Unix timestamps as required by Assembled API
      const startTimestamp = Math.floor(new Date(start_time).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(end_time).getTime() / 1000);
      
      const shiftData = {
        agent_id: agent_id, 
        type_id: activity_type_id, 
        start_time: startTimestamp,
        end_time: endTimestamp,
        description: notes || `${shift_type || 'regular'} shift`,
      };

      const response = await assembledCommon.makeRequest(
        context.auth as string,
        HttpMethod.POST,
        '/activities',
        shiftData
      );

      return {
        success: true,
        shift_id: response.body.id,
        message: 'Shift added successfully',
        data: response.body,
      };
    } catch (error) {
      throw new Error(`Failed to add shift: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});