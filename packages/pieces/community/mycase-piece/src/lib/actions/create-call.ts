import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createCall = createAction({
  auth: mycaseAuth,
  name: 'create_call',
  displayName: 'Create Call',
  description: 'Creates a new call in the call log in MyCase',
  props: {
    called_at: Property.DateTime({
      displayName: 'Called At',
      description: 'When the call happened',
      required: true,
    }),
    caller_phone_number: Property.ShortText({
      displayName: 'Caller Phone Number',
      description: 'The caller\'s phone number',
      required: true,
    }),
    call_for: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Call For',
      description: 'The staff member this call is associated with',
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
          return {
            disabled: false,
            options: response.data.map((staff: any) => ({
              label: `${staff.first_name} ${staff.last_name}`,
              value: staff.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load staff',
        };
      },
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'A description of the call',
      required: true,
    }),
    caller_type: Property.StaticDropdown({
      displayName: 'Caller Type',
      description: 'Choose how to identify the caller',
      required: true,
      options: {
        options: [
          { label: 'Unknown (provide name)', value: 'unknown' },
          { label: 'Existing Client', value: 'client' },
          { label: 'Existing Lead', value: 'lead' },
        ],
      },
      defaultValue: 'unknown',
    }),
    caller_name: Property.ShortText({
      displayName: 'Caller Name',
      description: 'The caller\'s name',
      required: false,
    }),
    client: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Client',
      description: 'The existing client',
      required: false,
      refreshers: ['caller_type'],
      options: async ({ auth, caller_type }) => {
        if (!auth || caller_type !== 'client') {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select "Existing Client" above to choose a client',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/clients', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((client: any) => ({
              label: `${client.first_name} ${client.last_name}${client.email ? ` (${client.email})` : ''}`,
              value: client.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load clients',
        };
      },
    }),
    lead: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Lead',
      description: 'The existing lead',
      required: false,
      refreshers: ['caller_type'],
      options: async ({ auth, caller_type }) => {
        if (!auth || caller_type !== 'lead') {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select "Existing Lead" above to choose a lead',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/leads', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((lead: any) => ({
              label: `${lead.first_name} ${lead.last_name}${lead.email ? ` (${lead.email})` : ''}`,
              value: lead.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load leads',
        };
      },
    }),
    call_type: Property.StaticDropdown({
      displayName: 'Call Type',
      description: 'Type of call',
      required: false,
      options: {
        options: [
          { label: 'Incoming', value: 'incoming' },
          { label: 'Outgoing', value: 'outgoing' },
        ],
      },
      defaultValue: 'incoming',
    }),
    resolved: Property.Checkbox({
      displayName: 'Resolved',
      description: 'Should this call show as resolved?',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);

    // Validate caller identification based on type
    if (context.propsValue.caller_type === 'unknown' && !context.propsValue.caller_name) {
      return {
        success: false,
        error: 'Caller name is required when caller type is "Unknown"',
      };
    }

    if (context.propsValue.caller_type === 'client' && !context.propsValue.client) {
      return {
        success: false,
        error: 'Client selection is required when caller type is "Existing Client"',
      };
    }

    if (context.propsValue.caller_type === 'lead' && !context.propsValue.lead) {
      return {
        success: false,
        error: 'Lead selection is required when caller type is "Existing Lead"',
      };
    }

    // Build the request body
    const requestBody: any = {
      called_at: new Date(context.propsValue.called_at).toISOString(),
      caller_phone_number: context.propsValue.caller_phone_number,
      call_for: { id: parseInt(context.propsValue.call_for) },
      message: context.propsValue.message,
    };

    // Add the appropriate caller identification
    if (context.propsValue.caller_type === 'unknown') {
      requestBody.caller_name = context.propsValue.caller_name;
    } else if (context.propsValue.caller_type === 'client') {
      requestBody.client = { id: parseInt(context.propsValue.client) };
    } else if (context.propsValue.caller_type === 'lead') {
      requestBody.lead = { id: parseInt(context.propsValue.lead) };
    }

    // Add optional fields
    if (context.propsValue.call_type) {
      requestBody.call_type = context.propsValue.call_type;
    }
    
    if (context.propsValue.resolved !== undefined) {
      requestBody.resolved = context.propsValue.resolved;
    }

    try {
      const response = await api.post('/calls', requestBody);
      
      if (response.success) {
        return {
          success: true,
          call: response.data,
          message: 'Call created successfully in call log',
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
        error: 'Failed to create call',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});