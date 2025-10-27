import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createCall = createAction({
  auth: mycaseAuth,
  name: 'create_call',
  displayName: 'Create Call',
  description: 'Creates a new call in the call log in MyCase',
  props: {
    called_at: Property.ShortText({
      displayName: 'Called At',
      description: 'ISO 8601 timestamp of when the call happened (e.g., 2024-01-15T10:00:00Z)',
      required: true,
    }),
    caller_phone_number: Property.ShortText({
      displayName: 'Caller Phone Number',
      description: 'The caller\'s phone number',
      required: true,
    }),
    call_for_staff_id: Property.Number({
      displayName: 'Call For Staff ID',
      description: 'ID of the staff member this call is for',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'A description of the call',
      required: true,
    }),
    caller_name: Property.ShortText({
      displayName: 'Caller Name',
      description: 'The caller\'s name (use this OR client_id OR lead_id, not multiple)',
      required: false,
    }),
    client_id: Property.Number({
      displayName: 'Client ID',
      description: 'ID of the client (use this OR caller_name OR lead_id, not multiple)',
      required: false,
    }),
    lead_id: Property.Number({
      displayName: 'Lead ID',
      description: 'ID of the lead (use this OR caller_name OR client_id, not multiple)',
      required: false,
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
    
    // Validate mutually exclusive fields
    const hasCallerName = !!context.propsValue.caller_name;
    const hasClientId = !!context.propsValue.client_id;
    const hasLeadId = !!context.propsValue.lead_id;
    const count = [hasCallerName, hasClientId, hasLeadId].filter(Boolean).length;
    
    if (count === 0) {
      return {
        success: false,
        error: 'Must provide one of: caller_name, client_id, or lead_id',
      };
    }
    
    if (count > 1) {
      return {
        success: false,
        error: 'Can only provide one of: caller_name, client_id, or lead_id',
      };
    }
    
    // Build the request body
    const requestBody: any = {
      called_at: context.propsValue.called_at,
      caller_phone_number: context.propsValue.caller_phone_number,
      call_for: { id: context.propsValue.call_for_staff_id },
      message: context.propsValue.message,
    };

    // Add the appropriate caller identification
    if (context.propsValue.caller_name) {
      requestBody.caller_name = context.propsValue.caller_name;
    } else if (context.propsValue.client_id) {
      requestBody.client = { id: context.propsValue.client_id };
    } else if (context.propsValue.lead_id) {
      requestBody.lead = { id: context.propsValue.lead_id };
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