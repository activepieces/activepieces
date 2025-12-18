import { createAction, Property } from '@activepieces/pieces-framework';
import { SMSAPIAuth } from '../common/auth';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const sendTextMessageToGroup = createAction({
  auth: SMSAPIAuth,
  name: 'sendTextMessageToGroup',
  displayName: 'Send Text Message To Group',
  description:
    'Send SMS message to all contacts in a group from your contacts database',
  props: {
    group: Property.ShortText({
      displayName: 'Group Name',
      description:
        'Name of the group from the contacts database to send message to',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description:
        'The SMS message content. You can use custom fields like [%contact.field_name%] for personalization',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'Sender Name',
      description:
        'Sender name (must be verified in SMSAPI). If not provided, default sender name will be used',
      required: false,
    }),
    date: Property.Number({
      displayName: 'Scheduled Date',
      description:
        'Schedule message for future delivery (UNIX timestamp). Leave empty to send immediately',
      required: false,
    }),
    fast: Property.Checkbox({
      displayName: 'Fast Delivery',
      description:
        'Send with highest priority for quickest delivery (costs 50% more)',
      required: false,
      defaultValue: false,
    }),
    test: Property.Checkbox({
      displayName: 'Test Mode',
      description: 'Test mode - message will not be sent (no charge)',
      required: false,
      defaultValue: false,
    }),
    encoding: Property.StaticDropdown({
      displayName: 'Encoding',
      description: 'Message encoding',
      required: false,
      options: {
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'ISO-8859-1', value: 'iso-8859-1' },
          { label: 'ISO-8859-2', value: 'iso-8859-2' },
          { label: 'Windows-1250', value: 'windows-1250' },
          { label: 'Windows-1251', value: 'windows-1251' },
        ],
      },
    }),
    normalize: Property.Checkbox({
      displayName: 'Normalize Special Characters',
      description:
        'Replace special characters with equivalents (ê→e, ñ→n, etc.)',
      required: false,
      defaultValue: false,
    }),
    flash: Property.Checkbox({
      displayName: 'Flash Message',
      description:
        'Send as flash SMS (automatically displayed on mobile screen)',
      required: false,
      defaultValue: false,
    }),
    idx: Property.ShortText({
      displayName: 'Custom IDX',
      description:
        'Optional custom value sent back in callback (max 255 chars)',
      required: false,
    }),
  },
  async run(context) {
    const {
      group,
      message,
      from,
      date,
      fast,
      test,
      encoding,
      normalize,
      flash,
      idx,
    } = context.propsValue;

    const params: any = {
      group,
      message,
      format: 'json',
    };

    if (from) params.from = from;
    if (date) params.date = date.toString();
    if (fast) params.fast = '1';
    if (test) params.test = '1';
    if (encoding) params.encoding = encoding;
    if (normalize) params.normalize = '1';
    if (flash) params.flash = '1';
    if (idx) params.idx = idx;

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
