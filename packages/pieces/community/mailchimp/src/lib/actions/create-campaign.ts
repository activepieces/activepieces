import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient, CampaignCreateData, CampaignContentData } from '../common/types';

export const createCampaign = createAction({
  auth: mailchimpAuth,
  name: 'create_campaign',
  classification: 'WRITE',
  displayName: 'Create Campaign',
  description: 'Create a new Mailchimp campaign',
  audience: 'both',
  aiMetadata: { description: 'Creates a new draft campaign of a chosen type (regular, plain-text, A/B, RSS, or variate) targeting an audience (list), and optionally sets its content from inline HTML, a hosted URL, or a template depending on the selected content type. Use to set up a campaign for later sending; this does not send it. Not idempotent: each call creates a distinct campaign.', idempotent: false },
  propertyGroups: [
    {
      key: 'campaign',
      display: 'section',
      label: 'Campaign',
      icon: 'send',
      props: ['campaign_type', 'list_id', 'title', 'subject_line'],
    },
    {
      key: 'sender',
      display: 'section',
      label: 'Sender',
      icon: 'user',
      props: ['from_name', 'from_email', 'reply_to', 'to_name'],
    },
    {
      key: 'content',
      display: 'section',
      label: 'Content',
      icon: 'file',
      props: ['content_info', 'content_type', 'content_url', 'template_id', 'html_content'],
    },
  ],
  props: {
    content_info: Property.MarkDown({
      value: 'Fill in only the field that matches the content type.',
      variant: MarkdownVariant.INFO,
    }),
    campaign_type: Property.StaticDropdown({
      displayName: 'Campaign Type',
      required: true,
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Plain Text', value: 'plaintext' },
          { label: 'A/B Test', value: 'ab' },
          { label: 'RSS', value: 'rss' },
          { label: 'Variate', value: 'variate' },
        ],
      },
    }),
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    subject_line: Property.ShortText({
      displayName: 'Subject Line',
      placeholder: 'Our October news',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Campaign Title',
      description: 'Internal name, not shown to subscribers.',
      placeholder: 'October newsletter',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      placeholder: 'Acme',
      required: true,
      width: 'half',
    }),
    from_email: Property.ShortText({
      displayName: 'From Email',
      placeholder: 'news@acme.com',
      required: true,
      width: 'half',
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply-To Email',
      placeholder: 'support@acme.com',
      required: true,
      width: 'half',
    }),
    to_name: Property.ShortText({
      displayName: 'To Name',
      description: 'Name shown in the To field, merge tags allowed.',
      placeholder: '*|FNAME|*',
      required: false,
      width: 'half',
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'How the campaign content is put together',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Template', value: 'template', description: 'Saved template', icon: 'file' },
          { label: 'HTML', value: 'html', description: 'Custom HTML', icon: 'code' },
          { label: 'URL', value: 'url', description: 'Web page', icon: 'paperclip' },
          { label: 'Multichannel', value: 'multichannel', description: 'In Mailchimp', icon: 'send' },
        ],
      },
    }),
    content_url: Property.ShortText({
      displayName: 'Content URL',
      description: 'Used when the content type is URL.',
      placeholder: 'https://example.com/newsletter.html',
      required: false,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: "Used for Template content; the ID is in the template's URL.",
      placeholder: '12345',
      required: false,
    }),
    html_content: Property.LongText({
      displayName: 'HTML Content',
      description: 'Used when the content type is HTML.',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    try {
      const client = mailchimp as unknown as MailchimpClient;
      client.setConfig({
        accessToken: accessToken,
        server: server,
      });

      const campaignData: CampaignCreateData = {
        type: context.propsValue.campaign_type,
        recipients: {
          list_id: context.propsValue.list_id as string,
        },
        settings: {
          subject_line: context.propsValue.subject_line,
          title: context.propsValue.title,
          from_name: context.propsValue.from_name,
          from_email: context.propsValue.from_email,
          reply_to: context.propsValue.reply_to,
          to_name: context.propsValue.to_name || '',
        },
      };



      const campaign = await client.campaigns.create(campaignData);

      // Set campaign content based on content type
      const contentData: CampaignContentData = {};
      
      if (context.propsValue.content_type === 'html' && context.propsValue.html_content) {
        contentData.html = context.propsValue.html_content;
      } else if (context.propsValue.content_type === 'url' && context.propsValue.content_url) {
        contentData.url = context.propsValue.content_url;
      } else if (context.propsValue.content_type === 'template' && context.propsValue.template_id) {
        contentData.template = {
          id: context.propsValue.template_id,
        };
      }

      // Set content if any content data is provided
      if (Object.keys(contentData).length > 0) {
        await client.campaigns.setContent(campaign.id, contentData);
      }

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