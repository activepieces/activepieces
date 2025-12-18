import { createAction, Property } from '@activepieces/pieces-framework';
import { SMSAPIAuth } from '../common/auth';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const sendTextMessage = createAction({
  auth: SMSAPIAuth,
  name: 'sendTextMessage',
  displayName: 'Send Text Message',
  description: 'Send an SMS message via SMSAPI',
  props: {
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'Recipient phone number with country code (e.g., 44123456789)',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The SMS message content (max 918 characters)',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'Sender Name',
      description:
        'Sender name (must be verified in SMSAPI). If not provided, default sender name will be used',
      required: false,
    }),
    date: Property.DateTime({
      displayName: 'Scheduled Date',
      description:
        'Schedule message for future delivery (UNIX timestamp). Leave empty to send immediately',
      required: false,
    }),

    normalize: Property.Checkbox({
      displayName: 'Normalize Special Characters',
      description:
        'Replace special characters with equivalents (ê→e, ñ→n, etc.)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      to,
      message,
      from,
      date,
      normalize,
    } = context.propsValue;

    const params: any = {
      to,
      message,
      format: 'json',
    };

    if (from) params.from = from;
    if (date) params.date = date.toString();
    if (normalize) params.normalize = '1';

    const queryParams = new URLSearchParams(params).toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.smsapi.com/sms.do?${queryParams}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body;
  },
});
