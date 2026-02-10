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
    start: Property.DateTime({
      displayName: 'Start Date/Time',
      description: 'The start date and time of this event',
      required: true,
    }),
    end: Property.DateTime({
      displayName: 'End Date/Time',
      description: 'The end date and time of this event',
      required: true,
    }),
    staff: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Staff',
      description: 'Staff members to associate with this event',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/staff', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          // Store staff data for reuse in required_staff dropdown
          const staffOptions = response.data.map((staff: any) => ({
            label: `${staff.first_name} ${staff.last_name}`,
            value: staff.id.toString(),
          }));
          
          return {
            disabled: false,
            options: staffOptions,
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load staff',
        };
      },
    }),
    required_staff: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Required Staff',
      description: 'Staff members who are required to attend (all others are optional)',
      required: false,
      refreshers: ['staff'],
      options: async ({ auth, staff }) => {
        if (!auth || !staff || !Array.isArray(staff) || staff.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select staff members first',
          };
        }

        // Fetch staff data once and cache
        const api = createMyCaseApi(auth);
        const response = await api.get('/staff', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          // Filter to only show staff that were selected in the staff field
          const allStaffData = response.data;
          const selectedStaffOptions = allStaffData
            .filter((s: any) => staff.includes(s.id.toString()))
            .map((s: any) => ({
              label: `${s.first_name} ${s.last_name}`,
              value: s.id.toString(),
            }));

          return {
            disabled: false,
            options: selectedStaffOptions,
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load staff',
        };
      },
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
    location: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Location',
      description: 'The location associated with this event',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/locations', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((location: any) => ({
              label: location.name,
              value: location.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load locations',
        };
      },
    }),
    case: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Case',
      description: 'The case associated with this event',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/cases', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((caseItem: any) => ({
              label: `${caseItem.name}${caseItem.case_number ? ` (${caseItem.case_number})` : ''}`,
              value: caseItem.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load cases',
        };
      },
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);

    // Validate that staff is selected
    if (!context.propsValue.staff || !Array.isArray(context.propsValue.staff) || context.propsValue.staff.length === 0) {
      return {
        success: false,
        error: 'At least one staff member must be selected',
      };
    }

    // Build the request body
    const requestBody: any = {
      name: context.propsValue.name,
      start: new Date(context.propsValue.start).toISOString(),
      end: new Date(context.propsValue.end).toISOString(),
      staff: context.propsValue.staff.map((staffId: string) => {
        // Check if this staff member is marked as required
        const isRequired = context.propsValue.required_staff?.includes(staffId) || false;

        return {
          id: parseInt(staffId),
          required: isRequired,
        };
      }),
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

    if (context.propsValue.location) {
      requestBody.location = { id: parseInt(context.propsValue.location) };
    }

    if (context.propsValue.case) {
      requestBody.case = { id: parseInt(context.propsValue.case) };
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