import { zohoMailAuth } from '../../index';
import { Property, createAction, DynamicPropsValue, InputPropertyMap, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ZOHO_MAIL_API_URL, fetchAccounts } from '../common';

const encodingOptions = [
  { label: 'UTF-8 (Default)', value: 'UTF-8' },
  { label: 'US-ASCII', value: 'US-ASCII' },
  { label: 'ISO-8859-1', value: 'ISO-8859-1' },
  { label: 'Big5', value: 'Big5' },
  { label: 'EUC-JP', value: 'EUC-JP' },
  { label: 'EUC-KR', value: 'EUC-KR' },
  { label: 'GB2312', value: 'GB2312' },
  { label: 'ISO-2022-JP', value: 'ISO-2022-JP' },
  { label: 'KOI8-R', value: 'KOI8-R' },
  { label: 'Shift_JIS', value: 'Shift_JIS' },
  { label: 'WINDOWS-1251', value: 'WINDOWS-1251' },
  { label: 'X-WINDOWS-ISO2022JP', value: 'X-WINDOWS-ISO2022JP' },
];

export const sendEmail = createAction({
  auth: zohoMailAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send an email via Zoho Mail',
  props: {
    accountId: Property.Dropdown({
      displayName: 'Account ID',
      description: 'Select the Zoho Mail Account ID to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }
        const accounts = await fetchAccounts(auth as OAuth2PropertyValue);
        if (accounts.length === 0) {
          return {
            disabled: true,
            placeholder: 'No accounts found. Please check your Zoho Mail setup.',
            options: [],
          };
        }
        return {
          disabled: false,
          options: accounts,
        };
      },
    }),
    fromAddress: Property.ShortText({
      displayName: 'From Email Address',
      description: 'Sender\'s email address (must be associated with the authenticated account).',
      required: true,
    }),
    toAddress: Property.ShortText({
      displayName: 'To Email Address',
      description: 'Recipient\'s email address.',
      required: true,
    }),
    ccAddress: Property.ShortText({
      displayName: 'CC Email Address',
      description: 'CC recipient\'s email address.',
      required: false,
    }),
    bccAddress: Property.ShortText({
      displayName: 'BCC Email Address',
      description: 'BCC recipient\'s email address.',
      required: false,
    }),
    subject: Property.LongText({
      displayName: 'Subject',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'HTML or plain text content of the email.',
      required: false,
    }),
    mailFormat: Property.StaticDropdown({
      displayName: 'Mail Format',
      required: false,
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Plain Text', value: 'plaintext' },
        ],
      },
      defaultValue: 'html',
    }),
    encoding: Property.StaticDropdown({
      displayName: 'Encoding',
      required: false,
      options: {
        options: encodingOptions,
      },
      defaultValue: 'UTF-8',
    }),
    askReceipt: Property.StaticDropdown({
      displayName: 'Ask for Read Receipt',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    isSchedule: Property.Checkbox({
      displayName: 'Schedule Email',
      description: 'Schedule the email to be sent at a later time.',
      required: false,
      defaultValue: false,
    }),
    schedulingOptions: Property.DynamicProperties({
      displayName: 'Scheduling Options',
      refreshers: ['isSchedule'],
      required: true,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const isScheduleEnabled = (propsValue as DynamicPropsValue)['isSchedule'] as boolean;
        const currentSchedulingOptions: InputPropertyMap = {};
        if (!isScheduleEnabled) {
          return currentSchedulingOptions;
        }
        currentSchedulingOptions['scheduleType'] = Property.StaticDropdown({
            displayName: 'Schedule Type',
            required: true,
            options: {
              options: [
                { label: 'After one hour', value: 1 },
                { label: 'After two hours', value: 2 },
                { label: 'After four hours', value: 3 },
                { label: 'Next day morning', value: 4 },
                { label: 'Next day afternoon', value: 5 },
                { label: 'Custom date and time', value: 6 },
              ],
            },
          });
        currentSchedulingOptions['timeZone'] = Property.ShortText({
            displayName: 'Time Zone (Required if Custom Date/Time)',
            description: 'E.g., GMT+05:30 or Asia/Calcutta. Required if Schedule Type is Custom.',
            required: false,
          });
        currentSchedulingOptions['scheduleTime'] = Property.ShortText({
            displayName: 'Schedule Time (Required if Custom Date/Time)',
            description: 'Format: MM/DD/YYYY HH:MM:SS. Required if Schedule Type is Custom.',
            required: false,
          });
        return currentSchedulingOptions;
      },
    }),
  },
  async run(context) {
    const {
        accountId, fromAddress, toAddress, ccAddress, bccAddress,
        subject, content, mailFormat, encoding, askReceipt, isSchedule,
        schedulingOptions
    } = context.propsValue;
    const accessToken = context.auth.access_token;

    const requestBody: Record<string, unknown> = {
      fromAddress,
      toAddress,
      subject: subject ?? '',
      content: content ?? '',
      mailFormat: mailFormat ?? 'html',
      encoding: encoding ?? 'UTF-8',
    };

    if (ccAddress) requestBody['ccAddress'] = ccAddress;
    if (bccAddress) requestBody['bccAddress'] = bccAddress;
    if (askReceipt) requestBody['askReceipt'] = askReceipt;

    if (isSchedule && schedulingOptions) {
      const currentSchedulingOptions = schedulingOptions as DynamicPropsValue;
      requestBody['isSchedule'] = true;
      requestBody['scheduleType'] = currentSchedulingOptions['scheduleType'];
      if (currentSchedulingOptions['scheduleType'] === 6) {
        if (!currentSchedulingOptions['timeZone'] || !currentSchedulingOptions['scheduleTime']) {
          throw new Error('Time Zone and Schedule Time are required for custom scheduling.');
        }
        requestBody['timeZone'] = currentSchedulingOptions['timeZone'];
        requestBody['scheduleTime'] = currentSchedulingOptions['scheduleTime'];
      }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${ZOHO_MAIL_API_URL}/accounts/${accountId}/messages`,
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});
