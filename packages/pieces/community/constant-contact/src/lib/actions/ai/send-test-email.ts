import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { testEmailOutputSchema } from '../../common/output-schemas';

export const sendTestEmailAiAction = createAction({
  auth: constantContactAuth,
  name: 'send_test_email_ai',
  classification: 'WRITE',
  displayName: 'Send Test Email',
  description: 'Sends a test copy of a campaign to up to 5 addresses.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends a test copy of a Constant Contact campaign activity (the primary_email activity from Get Email Campaign) to 1-5 email addresses. Real emails are delivered to those addresses and may count against send limits; it never sends to lists. Each call sends again. Needs the campaign_data permission.',
    idempotent: false,
  },
  outputSchema: testEmailOutputSchema,
  props: {
    campaign_activity_id: aiProps.text({ displayName: 'Campaign Activity ID', description: 'The primary_email campaign_activity_id from Get Email Campaign.', required: true }),
    email_addresses: aiProps.text({ displayName: 'Recipients', description: 'Comma-separated email addresses, 1 to 5.', required: true }),
    personal_message: aiProps.text({ displayName: 'Personal Message', description: 'Optional note shown above the test email.' }),
  },
  async run({ auth, propsValue }) {
    const [activityId] = ccInput.idList({ value: propsValue.campaign_activity_id, label: 'Campaign Activity ID', max: 1, required: true });
    const recipients = aiInput.emailList({ value: propsValue.email_addresses, label: 'Recipients', max: 5 });
    await ccClient.request({
      accessToken: auth.access_token,
      method: 'POST',
      path: `/emails/activities/${ccClient.segment(activityId)}/tests`,
      operation: 'send test email',
      requiredScope: 'campaign_data',
      body: { email_addresses: recipients, personal_message: ccInput.optionalText(propsValue.personal_message) },
    });
    return { campaign_activity_id: activityId, sent_to: recipients };
  },
});
