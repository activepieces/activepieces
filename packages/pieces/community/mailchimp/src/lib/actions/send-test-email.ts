import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const sendTestEmail = createAction({
  auth: mailchimpAuth,
  name: 'send_test_email',
  classification: 'WRITE',
  displayName: 'Send Test Email',
  description: 'Send a test version of a campaign to a few email addresses.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a test copy of a campaign (campaign_id) to the given addresses only, not to the audience. Mailchimp limits how many tests an account can send per day (lower on the free plan). Not idempotent: every call sends another email.',
    idempotent: false,
  },
  outputSchema: mailchimpOutputSchemas['campaignAction'],
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
    test_emails: Property.Array({
      displayName: 'Test Recipients',
      description: 'Email addresses that receive the test.',
      required: true,
    }),
    send_type: Property.StaticDropdown<string>({
      displayName: 'Format',
      required: true,
      defaultValue: 'html',
      options: {
        disabled: false,
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Plain Text', value: 'plaintext' },
        ],
      },
    }),
  },
  async run(context) {
    const testEmails = mailchimpApi.toStringList(context.propsValue.test_emails);
    if (testEmails.length === 0) {
      throw new Error('Add at least one test recipient.');
    }
    const sendType = context.propsValue.send_type === 'plaintext' ? 'plaintext' : 'html';
    const campaignId = mailchimpApi.requireText({ value: context.propsValue.campaign_id, label: 'Campaign' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = `/campaigns/${encodeURIComponent(campaignId)}`;
    await client.request<unknown>({
      method: HttpMethod.POST,
      path: `${path}/actions/test`,
      body: { test_emails: testEmails, send_type: sendType },
      operation: 'send test email',
    });
    return { success: true, campaign_id: campaignId, test_emails: testEmails };
  },
});
