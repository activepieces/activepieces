import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import { staffDropdown, clientDropdown, leadDropdown } from '../common/props';

export const createCall = createAction({
  auth: myCaseAuth,
  name: 'createCall',
  displayName: 'Create Call',
  description: 'Create a call log entry',
  props: {
    called_at: Property.DateTime({
      displayName: 'Called At',
      description: 'When the call happened',
      required: true,
    }),
    caller_phone_number: Property.ShortText({
      displayName: 'Caller Phone Number',
      description: "The caller's phone number",
      required: true,
    }),
    call_for_staff_id: staffDropdown({
      description: 'Staff member this call is for',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Description of the call',
      required: true,
    }),
    caller_type: Property.StaticDropdown({
      displayName: 'Caller Type',
      description: 'Type of caller',
      required: true,
      options: {
        options: [
          { label: 'Name (Other)', value: 'caller_name' },
          { label: 'Client', value: 'client' },
          { label: 'Lead', value: 'lead' },
        ],
      },
    }),
    caller_fields: Property.DynamicProperties({
      displayName: 'Caller Information',
      required: true,
      refreshers: ['caller_type'],
      props: async ({ caller_type }: any) => {
        if (!caller_type) return {};

        const fields: any = {};

        if (caller_type === 'caller_name') {
          fields.caller_name = Property.ShortText({
            displayName: 'Caller Name',
            description: "The caller's name",
            required: true,
          });
        } else if (caller_type === 'client') {
          fields.client_id = clientDropdown({
            description: 'Select the client',
            required: true,
          });
        } else if (caller_type === 'lead') {
          fields.lead_id = leadDropdown({
            description: 'The lead ID',
            required: true,
          });
        }

        return fields;
      },
    }),
    call_type: Property.StaticDropdown({
      displayName: 'Call Type',
      description: 'Direction of the call',
      required: false,
      defaultValue: 'incoming',
      options: {
        options: [
          { label: 'Incoming', value: 'incoming' },
          { label: 'Outgoing', value: 'outgoing' },
        ],
      },
    }),
    resolved: Property.Checkbox({
      displayName: 'Resolved',
      description: 'Mark call as resolved',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload: any = {
      called_at: propsValue.called_at,
      caller_phone_number: propsValue.caller_phone_number,
      call_for: { id: propsValue.call_for_staff_id },
      message: propsValue.message,
      call_type: propsValue.call_type,
      resolved: propsValue.resolved,
    };

    const callerFields = propsValue.caller_fields as any;

    if (propsValue.caller_type === 'caller_name' && callerFields.caller_name) {
      payload.caller_name = callerFields.caller_name;
    } else if (propsValue.caller_type === 'client' && callerFields.client_id) {
      payload.client = { id: callerFields.client_id };
    } else if (propsValue.caller_type === 'lead' && callerFields.lead_id) {
      payload.lead = { id: callerFields.lead_id };
    }

    return await myCaseApiService.createCall({
      accessToken: auth.access_token,
      payload,
    });
  },
});
