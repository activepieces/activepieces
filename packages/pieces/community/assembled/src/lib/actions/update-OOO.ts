import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateOOO = createAction({
  name: 'update_OOO',
  displayName: 'Update OOO Request',
  description: 'Updates an existing OOO request.',
  props: {
    OOO_id: Property.ShortText({
      displayName: 'OOO ID',
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    reason: Property.LongText({
      displayName: 'Reason',
      required: false,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'ID of the user for the time off request (required for creating new request)',
      required: true,
    }),
    activity_type_id: Property.ShortText({
      displayName: 'Activity Type ID',
      description: 'UUID of the activity type for time off (required for creating new request)',
      required: true,
    }),
  },
  async run(context) {
    const { OOO_id, start_date, end_date, status, reason, user_id, activity_type_id } = context.propsValue;
    
    // no direct endpoint to update a time off request, so need to cancel and create new time off request
    try {
      // cancel the existing time off request
      console.log(`Canceling existing time off request: ${OOO_id}`);
      await assembledCommon.makeRequest(
        context.auth as string,
        HttpMethod.POST,
        `/time_off/${OOO_id}/cancel`
      );
      
      // create new time off request with updated details
      console.log('Creating new time off request with updated details');
      const newRequestData: Record<string, unknown> = {
        user_id,
        activity_type_id,
        all_day: true,
      };
      
      if (start_date) newRequestData['start_time'] = Math.floor(new Date(start_date).getTime() / 1000);
      if (end_date) newRequestData['end_time'] = Math.floor(new Date(end_date).getTime() / 1000);
      if (reason) newRequestData['description'] = reason;
      
      const response = await assembledCommon.makeRequest(
        context.auth as string,
        HttpMethod.POST,
        '/time_off',
        newRequestData
      );
      
      return {
        success: true,
        message: 'Time off request updated successfully (canceled old and created new)',
        canceled_request_id: OOO_id,
        new_request_id: response.body.id,
        data: response.body,
      };
      
    } catch (error) {
      throw new Error(`Failed to update time off request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});