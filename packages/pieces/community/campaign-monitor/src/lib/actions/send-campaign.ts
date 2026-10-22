import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, draftCampaignId } from '../common/props';
import { sendCampaignOutputSchema } from '../output-schemas';

export const sendCampaignAction = createAction({
  auth: campaignMonitorAuth,
  name: 'send_campaign',
  classification: 'WRITE',
  displayName: 'Send Campaign',
  description: 'Sends or schedules a draft campaign.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a Campaign Monitor draft campaign to its lists and segments, either immediately or at a scheduled time (YYYY-MM-DD HH:MM in the client time zone), and emails a confirmation to the given addresses. Once sent, emails cannot be recalled. Not idempotent: a draft can only be sent once, so a retry after success fails.',
    idempotent: false,
  },
  outputSchema: sendCampaignOutputSchema,
  props: {
    clientId: clientId,
    campaignId: draftCampaignId,
    confirmationEmail: Property.ShortText({
      displayName: 'Confirmation Email',
      description: 'Up to 5 comma-separated addresses notified when sent.',
      required: true,
    }),
    sendDate: Property.ShortText({
      displayName: 'Send Date',
      description: '"Immediately" or YYYY-MM-DD HH:MM in the client time zone.',
      required: true,
      defaultValue: 'Immediately',
    }),
  },
  async run({ propsValue, auth }) {
    const sendDate = propsValue.sendDate.trim();
    if (
      sendDate.toLowerCase() !== 'immediately' &&
      !SEND_DATE_FORMAT.test(sendDate)
    ) {
      throw new Error(
        'Send Date must be "Immediately" or in the format YYYY-MM-DD HH:MM.'
      );
    }
    const normalizedSendDate =
      sendDate.toLowerCase() === 'immediately' ? 'Immediately' : sendDate;
    await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/campaigns/${propsValue.campaignId}/send.json`,
      body: {
        ConfirmationEmail: propsValue.confirmationEmail
          .split(',')
          .map((address) => address.trim())
          .filter((address) => address.length > 0)
          .join(','),
        SendDate: normalizedSendDate,
      },
    });
    return {
      success: true,
      campaignId: propsValue.campaignId,
      sendDate: normalizedSendDate,
    };
  },
});

const SEND_DATE_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
