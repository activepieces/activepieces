import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const createCampaign = createAction({
  auth: mailchimpAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new email campaign in Mailchimp',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Campaign Type',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Plain Text', value: 'plaintext' },
          { label: 'A/B Test', value: 'absplit' },
          { label: 'RSS', value: 'rss' },
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
      description: 'The title of the campaign (internal use)',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      description: 'The "from" name on the campaign',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To Email',
      description: 'The reply-to email address for the campaign',
      required: true,
    }),
    html_content: Property.LongText({
      displayName: 'HTML Content',
      description: 'The HTML content for the campaign',
      required: false,
    }),
    text_content: Property.LongText({
      displayName: 'Text Content',
      description: 'The plain text content for the campaign',
      required: false,
    }),
  },
  async run(context) {
    try {
      const campaignData = {
        type: context.propsValue.type,
        recipients: {
          list_id: context.propsValue.list_id,
        },
        settings: {
          subject_line: context.propsValue.subject_line,
          title: context.propsValue.title,
          from_name: context.propsValue.from_name,
          reply_to: context.propsValue.reply_to,
        },
      };

      // Create the campaign
      const campaignResponse = await mailchimpCommon.makeApiRequest(
        context.auth,
        '/campaigns',
        'POST' as any,
        campaignData
      );

      const campaignId = campaignResponse.body.id;

      // Set content if provided
      if (context.propsValue.html_content || context.propsValue.text_content) {
        const contentData: any = {};
        if (context.propsValue.html_content) {
          contentData.html = context.propsValue.html_content;
        }
        if (context.propsValue.text_content) {
          contentData.plain_text = context.propsValue.text_content;
        }

        await mailchimpCommon.makeApiRequest(
          context.auth,
          `/campaigns/${campaignId}/content`,
          'PUT' as any,
          contentData
        );
      }

      return campaignResponse.body;
    } catch (error) {
      throw new Error(`Failed to create campaign: ${JSON.stringify(error)}`);
    }
  },
});
