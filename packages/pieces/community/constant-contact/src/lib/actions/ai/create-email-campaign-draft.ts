import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { campaignOutputSchema } from '../../common/output-schemas';

export const createEmailCampaignDraftAiAction = createAction({
  auth: constantContactAuth,
  name: 'create_email_campaign_draft_ai',
  classification: 'WRITE',
  displayName: 'Create Email Campaign Draft',
  description: 'Creates a draft email campaign from custom HTML. It is not sent or scheduled.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a DRAFT Constant Contact email campaign from custom HTML; it is never sent or scheduled (do that in Constant Contact). from_email and reply_to_email must be CONFIRMED sender addresses (see List Sender Email Addresses), the name must be unique, and the HTML must contain [[trackingImage]] inside <body>. Each call creates a new draft. Needs the campaign_data permission.',
    idempotent: false,
  },
  outputSchema: campaignOutputSchema,
  props: {
    name: aiProps.text({ displayName: 'Campaign Name', description: 'Unique internal name, up to 80 characters.', required: true }),
    subject: aiProps.text({ displayName: 'Subject', description: 'Email subject line.', required: true }),
    from_name: aiProps.text({ displayName: 'From Name', description: 'Sender name, up to 100 characters.', required: true }),
    from_email: aiProps.text({ displayName: 'From Email', description: 'A CONFIRMED sender address of the account.', required: true }),
    reply_to_email: aiProps.text({ displayName: 'Reply-To Email', description: 'A CONFIRMED sender address of the account.', required: true }),
    html_content: aiProps.text({ displayName: 'HTML Content', description: 'Full HTML, up to 150,000 characters, with [[trackingImage]] inside <body>.', required: true }),
    preheader: aiProps.text({ displayName: 'Preheader', description: 'Optional preview text, up to 200 characters.' }),
  },
  async run({ auth, propsValue }) {
    const name = ccInput.textWithin({ value: propsValue.name, label: 'Campaign Name', max: 80 });
    const subject = ccInput.optionalText(propsValue.subject);
    const fromName = ccInput.textWithin({ value: propsValue.from_name, label: 'From Name', max: 100 });
    const [fromEmail] = aiInput.emailList({ value: propsValue.from_email, label: 'From Email', max: 1 });
    const [replyToEmail] = aiInput.emailList({ value: propsValue.reply_to_email, label: 'Reply-To Email', max: 1 });
    const html = typeof propsValue.html_content === 'string' ? propsValue.html_content : '';
    if (name === undefined || subject === undefined || fromName === undefined) {
      throw new Error('Campaign Name, Subject and From Name are required.');
    }
    if (html.trim() === '' || html.length > 150_000) {
      throw new Error('HTML Content is required and can be at most 150,000 characters.');
    }
    if (!html.includes('[[trackingImage]]')) {
      throw new Error('HTML Content must contain [[trackingImage]] inside the <body> element, as Constant Contact requires for custom-code emails.');
    }
    const response = await ccClient.request({
      accessToken: auth.access_token,
      method: 'POST',
      path: '/emails',
      operation: 'create email campaign draft',
      requiredScope: 'campaign_data',
      body: {
        name,
        email_campaign_activities: [
          {
            format_type: 5,
            from_name: fromName,
            from_email: fromEmail,
            reply_to_email: replyToEmail,
            subject,
            html_content: html,
            preheader: ccInput.textWithin({ value: propsValue.preheader, label: 'Preheader', max: 200 }),
          },
        ],
      },
    });
    return response.body;
  },
});
