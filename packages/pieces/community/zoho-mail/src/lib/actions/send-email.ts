import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { zohoMailAuth } from "../../index";
import { zohoMailCommon } from "../common";

export const sendEmail = createAction({
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send an email using Zoho Mail',
  auth: zohoMailAuth,
  props: {
    accountId: zohoMailCommon.accountIdProperty,
    fromAddress: Property.ShortText({
      displayName: 'From Address',
      description: 'The email address to send from',
      required: true,
    }),
    toAddress: Property.Array({
      displayName: 'To',
      description: 'The email addresses to send to',
      required: true,
    }),
    ccAddress: Property.Array({
      displayName: 'CC',
      description: 'The email addresses to CC',
      required: false,
    }),
    bccAddress: Property.Array({
      displayName: 'BCC',
      description: 'The email addresses to BCC',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the email',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the email',
      required: true,
    }),
    mailFormat: Property.StaticDropdown({
      displayName: 'Mail Format',
      description: 'The format of the email',
      required: false,
      defaultValue: 'html',
      options: {
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Plain Text', value: 'plaintext' },
        ],
      },
    }),
    askReceipt: Property.Checkbox({
      displayName: 'Request Read Receipt',
      description: 'Request a read receipt from the recipient',
      required: false,
      defaultValue: false,
    }),
    isSchedule: Property.Checkbox({
      displayName: 'Schedule Email',
      description: 'Schedule the email to be sent later',
      required: false,
      defaultValue: false,
    }),
    scheduleType: Property.StaticDropdown({
      displayName: 'Schedule Type',
      description: 'When to send the scheduled email',
      required: false,
      defaultValue: '1',
      options: {
        options: [
          { label: 'After 1 hour', value: '1' },
          { label: 'After 2 hours', value: '2' },
          { label: 'After 4 hours', value: '3' },
          { label: 'Next day morning', value: '4' },
          { label: 'Next day afternoon', value: '5' },
          { label: 'Custom date and time', value: '6' },
        ],
      },
      refreshers: ['isSchedule'],
      showIf: (values) => !!values['isSchedule'],
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'The timezone for scheduling (e.g., GMT 5:30)',
      required: false,
      refreshers: ['scheduleType', 'isSchedule'],
      showIf: (values) => !!values['isSchedule'] && values['scheduleType'] === '6',
    }),
    scheduleTime: Property.ShortText({
      displayName: 'Schedule Time',
      description: 'The date and time to send the email (Format: MM/DD/YYYY HH:MM:SS)',
      required: false,
      refreshers: ['scheduleType', 'isSchedule'],
      showIf: (values) => !!values['isSchedule'] && values['scheduleType'] === '6',
    }),
  },
  async run({ auth, propsValue }) {
    const {
      accountId,
      fromAddress,
      toAddress,
      ccAddress,
      bccAddress,
      subject,
      content,
      mailFormat,
      askReceipt,
      isSchedule,
      scheduleType,
      timeZone,
      scheduleTime
    } = propsValue;

    // Use provided account ID or get the default one
    const finalAccountId = accountId || await zohoMailCommon.getAccountId(auth);

    const requestBody: Record<string, unknown> = {
      fromAddress,
      toAddress: zohoMailCommon.formatEmailAddresses(toAddress as string[]),
      subject,
      content,
      mailFormat: mailFormat || 'html',
      askReceipt: askReceipt ? 'yes' : 'no',
    };

    if (ccAddress && (ccAddress as string[]).length > 0) {
      requestBody.ccAddress = zohoMailCommon.formatEmailAddresses(ccAddress as string[]);
    }

    if (bccAddress && (bccAddress as string[]).length > 0) {
      requestBody.bccAddress = zohoMailCommon.formatEmailAddresses(bccAddress as string[]);
    }

    // Add scheduling parameters if enabled
    if (isSchedule) {
      requestBody.isSchedule = true;
      requestBody.scheduleType = scheduleType;

      // Add custom scheduling parameters if needed
      if (scheduleType === '6') {
        if (!timeZone) {
          throw new Error('Time Zone is required for custom scheduling');
        }
        if (!scheduleTime) {
          throw new Error('Schedule Time is required for custom scheduling');
        }
        requestBody.timeZone = timeZone;
        requestBody.scheduleTime = scheduleTime;
      }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoMailCommon.baseUrl}/accounts/${finalAccountId}/messages`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to send email: ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
});
