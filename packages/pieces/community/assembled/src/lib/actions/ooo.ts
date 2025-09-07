import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const OOO = createAction({
  name: 'OOO',
  displayName: 'Create OOO Request',
  description: 'Create an Out of Office request in Assembled.',
  props: {
    mock_mode: Property.Checkbox({
      displayName: 'Mock Mode',
      description: 'Use mock data for testing',
      required: false,
      defaultValue: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'ID of the user requesting time off',
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date of the OOO period',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'End date of the OOO period',
      required: true,
    }),
    activity_type_id: Property.ShortText({
      displayName: 'Activity Type ID',
      description: 'UUID of the activity type for time off (can be retrieved from activity types endpoints)',
      required: true,
    }),
    all_day: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Whether this is an all-day OOO event',
      required: false,
      defaultValue: true,
    }),
    reason: Property.LongText({
      displayName: 'Reason',
      description: 'Reason for the OOO request',
      required: false,
    }),
  },
  async run(context) {
    const { mock_mode, user_id, start_date, end_date, activity_type_id, all_day, reason } = context.propsValue;
    
    // Mock response for testing
    if (mock_mode) {
      return {
        success: true,
        message: 'Mock OOO created successfully',
        data: {
          id: `mock_ooo_${Date.now()}`,
          user_id,
          start_date,
          end_date,
          activity_type_id: activity_type_id || 'mock-activity-type-id',
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      };
    }
    
    try {
      const oooData = {
        user_id: user_id,
        start_time: Math.floor(new Date(start_date).getTime() / 1000),
        end_time: Math.floor(new Date(end_date).getTime() / 1000),
        activity_type_id,
        all_day: all_day ?? true,
        description: reason || '',
      };

      const response = await assembledCommon.makeRequest(
        context.auth as string,
        HttpMethod.POST,
        '/time_off',
        oooData
      );

      return {
        success: true,
        ooo_id: response.body.id,
        message: 'OOO request created successfully',
        data: response.body,
      };
    } catch (error) {
      throw new Error(`Failed to create OOO request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});