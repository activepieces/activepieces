import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addShift = createAction({
  name: 'add_shift',
  displayName: 'Add Shift on Assembled',
  description: 'Add a new shift to a user\'s schedule in Assembled',
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'ID of the user to assign the shift to',
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
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes for the shift',
      required: false,
    }),
  },
  async run(context) {
    const { user_id, start_time, end_time, date, shift_type, notes } = context.propsValue;
    
    try {
      const shiftData = {
        user_id,
        start_time: assembledCommon.formatDateTime(start_time),
        end_time: assembledCommon.formatDateTime(end_time),
        date: assembledCommon.formatDate(date),
        shift_type: shift_type || 'regular',
        notes: notes || '',
      };

      const response = await assembledCommon.makeRequest(
        context.auth as string,
        HttpMethod.POST,
        `/users/${user_id}/shifts`,
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