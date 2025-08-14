import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const OOO = createAction({
  name: 'OOO',
  displayName: 'OOO',
  description: 'Create an Out of Office request in Assembled',
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
    event_type: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Type of time off',
      required: false,
      defaultValue: 'PTO',
      options: {
        options: [
          { label: 'Paid Time Off (PTO)', value: 'PTO' },
          { label: 'Sick Leave', value: 'SICK' },
          { label: 'Personal Leave', value: 'PERSONAL' },
          { label: 'Vacation', value: 'VACATION' },
          { label: 'Holiday', value: 'HOLIDAY' },
          { label: 'Out of Office', value: 'OOO' },
        ],
      },
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
    const { mock_mode, user_id, start_date, end_date, event_type, all_day, reason } = context.propsValue;
    
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
          event_type: event_type || 'PTO',
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      };
    }
    
    try {
      const oooData = {
        user_id,
        start_date: all_day ? 
          assembledCommon.formatDate(start_date) : 
          assembledCommon.formatDateTime(start_date),
        end_date: all_day ? 
          assembledCommon.formatDate(end_date) : 
          assembledCommon.formatDateTime(end_date),
        event_type: event_type || 'OOO',
        all_day: all_day ?? true,
        reason: reason || '',
        status: 'pending',
      };

      const response = await assembledCommon.makeRequest(
        context.auth as string,
        HttpMethod.POST,
        '/time-off-requests',
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