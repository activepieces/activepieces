import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const createCampaign = createAction({
  auth: mailchimpAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new Mailchimp campaign',
  props: {
    campaign_type: Property.StaticDropdown({
      displayName: 'Campaign Type',
      description: 'The type of campaign to create',
      required: true,
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Plain Text', value: 'plaintext' },
          { label: 'RSS', value: 'rss' },
          { label: 'Variate', value: 'variate' },
        ],
      },
    }),
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    subject_line: Property.ShortText({
      displayName: 'Subject Line',
      description: 'The subject line for the campaign',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Campaign Title',
      description: 'The title of the campaign',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      description: 'The name that will appear in the "From" field',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To Email',
      description: 'The email address that will receive replies',
      required: true,
    }),
    to_name: Property.ShortText({
      displayName: 'To Name',
      description: 'The name that will appear in the "To" field (e.g., *|FNAME|*)',
      required: false,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'How the campaign content is put together',
      required: true,
      options: {
        options: [
          { label: 'Template', value: 'template' },
          { label: 'HTML', value: 'html' },
          { label: 'URL', value: 'url' },
          { label: 'Multichannel', value: 'multichannel' },
        ],
      },
    }),
    content_url: Property.ShortText({
      displayName: 'Content URL',
      description: 'The URL where the campaign content is hosted (required if content_type is "url")',
      required: false,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to use (required if content_type is "template")',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    try {
      const mailchimp = require('@mailchimp/mailchimp_marketing');
      mailchimp.setConfig({
        accessToken: accessToken,
        server: server,
      });

      const campaignData: any = {
        type: context.propsValue.campaign_type,
        recipients: {
          list_id: context.propsValue.list_id,
        },
        settings: {
          subject_line: context.propsValue.subject_line,
          title: context.propsValue.title,
          from_name: context.propsValue.from_name,
          reply_to: context.propsValue.reply_to,
          to_name: context.propsValue.to_name || '',
          content_type: context.propsValue.content_type,
        },
      };

      if (context.propsValue.content_type === 'url' && context.propsValue.content_url) {
        campaignData.settings.content_url = context.propsValue.content_url;
      }

      if (context.propsValue.content_type === 'template' && context.propsValue.template_id) {
        campaignData.settings.template_id = parseInt(context.propsValue.template_id);
      }

      const campaign = await mailchimp.campaigns.create(campaignData);

      return {
        success: true,
        campaign_id: campaign.id,
        campaign_web_id: campaign.web_id,
        campaign_title: campaign.settings?.title,
        campaign_subject: campaign.settings?.subject_line,
        campaign_status: campaign.status,
        campaign_type: campaign.type,
        created_at: campaign.create_time,
        archive_url: campaign.archive_url,
        _links: campaign._links || [],
      };
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      throw new Error(`Failed to create campaign: ${error.message || JSON.stringify(error)}`);
    }
  },
});
