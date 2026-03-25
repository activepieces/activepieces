import { createAction, Property } from '@activepieces/pieces-framework';
import { octopushAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendANewSms = createAction({
  auth: octopushAuth,
  name: 'sendANewSms',
  displayName: 'Send a New SMS',
  description: 'Send an SMS message to one or more recipients',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Recipient phone number in international format (e.g., +33612345678)',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Recipient first name (optional)',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Recipient last name (optional)',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message Text',
      description: 'The SMS message content (1-1224 characters)',
      required: true,
    }),
    sender: Property.ShortText({
      displayName: 'Sender ID',
      description: 'Sender name/ID (3-11 alphanumeric characters)',
      required: true,
    }),
    purpose: Property.StaticDropdown({
      displayName: 'Purpose',
      description: 'Type of SMS campaign',
      required: false,
      options: {
        options: [
          { label: 'Alert', value: 'alert' },
          { label: 'Transactional', value: 'transactional' },
          { label: 'Marketing', value: 'marketing' },
          { label: 'Wholesale', value: 'wholesale' },
        ],
      },
    }),
    send_at: Property.ShortText({
      displayName: 'Send At',
      description:
        'Schedule sending time in ISO8601 format (e.g., 2024-12-25T10:30:00+01:00) - optional',
      required: false,
    }),
    with_replies: Property.Checkbox({
      displayName: 'Enable Replies',
      description: 'Enable to receive recipient replies',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      phone_number,
      first_name,
      last_name,
      message,
      sender,
      purpose,
      send_at,
      with_replies,
    } = context.propsValue;

    const recipient: any = {
      phone_number,
    };

    if (first_name) recipient.first_name = first_name;
    if (last_name) recipient.last_name = last_name;

    const request: any = {
      text: message,
      recipients: [recipient],
      sender,
    };

    if (purpose) request.purpose = purpose;
    if (send_at) request.send_at = send_at;
    if (with_replies) request.with_replies = with_replies;

    const response = await makeRequest<any>(
      context.auth.props.api_key,
      context.auth.props.api_login,
      HttpMethod.POST,
      '/sms-campaign/send',
      request
    );

    return response;
  },
});
