import { createAction, Property } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const createCampaignAction = createAction({
  auth: senderAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Creates a draft campaign in Sender',
  props: {
    title: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'The name of the campaign',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'The subject line of the email',
      required: true,
    }),
    fromName: Property.ShortText({
      displayName: 'From Name',
      description: 'Sender name',
      required: true,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      description: 'Reply-to email address',
      required: true,
    }),
    contentType: Property.LongText({
      displayName: 'Content Type',
      description: 'The value must be one of "editor", "html", or "text"',
      required: true,
    }),
    groups: Property.ShortText({
      displayName: 'Group IDs',
      description: 'Comma-separated list of group IDs to send to',
      required: true,
    }),
  },
  async run(context) {
    const campaignData: any = {
      name: context.propsValue.title,
      subject: context.propsValue.subject,
      from_name: context.propsValue.fromName,
      content_type: context.propsValue.contentType,
      groups: context.propsValue.groups.split(',').map(id => id.trim()),
      status: 'draft',
    };

    if (context.propsValue.replyTo) {
      campaignData.reply_to = context.propsValue.replyTo;
    }

    const response = await makeSenderRequest(
      context.auth,
      '/campaigns',
      HttpMethod.POST,
      campaignData
    );

    return response.body;
  },
});