import { createAction, Property } from '@activepieces/pieces-framework';
import { groupIdsDropdown, makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { group } from 'console';


export const createCampaignAction = createAction({
  auth: senderAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Creates a draft campaign in Sender',
  audience: 'both',
  aiMetadata: { description: 'Creates a new draft email campaign in a Sender account targeting one or more subscriber groups, with subject, sender name, reply-to, and content type. Use to set up a campaign for later sending (it is not sent here). Not idempotent: each call creates a separate draft, so repeating produces duplicates. Content type must be one of "editor", "html", or "text".', idempotent: false },
  props: {
    title: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'The name of the campaign',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'The subject line of the email',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From Name',
      description: 'Sender name',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Reply-to email address',
      required: true,
    }),
    content_type: Property.LongText({
      displayName: 'Content Type',
      description: 'The value must be one of "editor", "html", or "text"',
      required: true,
    }),
    groups: groupIdsDropdown,
  },
  async run(context) {
    const campaignData: any = {
      title: context.propsValue.title,
      subject: context.propsValue.subject,
      from: context.propsValue.from,
      content_type: context.propsValue.content_type,
      groups: context.propsValue.groups,
    };

    if (context.propsValue.reply_to) {
      campaignData.reply_to = context.propsValue.reply_to;
    }

    const response = await makeSenderRequest(
      context.auth.secret_text,
      '/campaigns',
      HttpMethod.POST,
      campaignData
    );

    return response.body;
  },
});