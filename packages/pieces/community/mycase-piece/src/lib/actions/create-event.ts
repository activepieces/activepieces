import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createEvent = createAction({
  auth: mycaseAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Creates a new event in MyCase',
  props: {
    name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of this event',
      required: true,
    }),
    start: Property.ShortText({
      displayName: 'Start Date/Time',
      description: 'Start date/time in ISO 8601 format (e.g., 2024-01-15T09:00:00Z)',
      required: true,
    }),
    end: Property.ShortText({
      displayName: 'End Date/Time',
      description: 'End date/time in ISO 8601 format (e.g., 2024-01-15T10:00:00Z)',
      required: true,
    }),
    staff_id: Property.Number({
      displayName: 'Staff ID',
      description: 'ID of staff member to associate with this event',
      required: true,
    }),
    staff_required: Property.Checkbox({
      displayName: 'Staff Required',
      description: 'Is this staff member required to attend?',
      required: false,
      defaultValue: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Event description',
      required: false,
    }),
    all_day: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Is this an all day event?',
      required: false,
      defaultValue: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private Event',
      description: 'Is this a private event?',
      required: false,
      defaultValue: false,
    }),
    location_id: Property.Number({
      displayName: 'Location ID',
      description: 'ID of the location associated with this event',
      required: false,
    }),
    case_id: Property.Number({
      displayName: 'Case ID',
      description: 'ID of the case associated with this event',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      name: context.propsValue.name,
      start: context.propsValue.start,
      end: context.propsValue.end,
      staff: [{
        id: context.propsValue.staff_id,
        required: context.propsValue.staff_required || false,
      }],
    };

    // Add optional fields
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }
    
    if (context.propsValue.all_day !== undefined) {
      requestBody.all_day = context.propsValue.all_day;
    }
    
    if (context.propsValue.private !== undefined) {
      requestBody.private = context.propsValue.private;
    }
    
    if (context.propsValue.location_id) {
      requestBody.location = { id: context.propsValue.location_id };
    }
    
    if (context.propsValue.case_id) {
      requestBody.case = { id: context.propsValue.case_id };
    }

    try {
      const response = await api.post('/events', requestBody);
      
      if (response.success) {
        return {
          success: true,
          event: response.data,
          message: `Event "${context.propsValue.name}" created successfully`,
        };
      } else {
        return {
          success: false,
          error: response.error,
          details: response.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create event',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});