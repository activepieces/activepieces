import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

export const mailChimpCreateCampaign = createAction({
  auth: mailchimpAuth,
  name: 'create-campaign',
  displayName: 'Create Campaign',
  description: 'Creates a new email campaign.',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    subject_line: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    from_name: Property.ShortText({ displayName: 'From Name', required: true }),
    reply_to: Property.ShortText({
      displayName: 'Reply-to Email',
      required: true,
    }),
  },
  async run(ctx) {
    const token = getAccessTokenOrThrow(ctx.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const body = {
      type: 'regular',
      recipients: { list_id: ctx.propsValue.list_id! },
      settings: {
        subject_line: ctx.propsValue.subject_line!,
        from_name: ctx.propsValue.from_name!,
        reply_to: ctx.propsValue.reply_to!,
      },
    };

    const resp = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://${server}.api.mailchimp.com/3.0/campaigns`,
      headers: { Authorization: `OAuth ${token}` },
      body,
    });

    return resp.body;
  },
});
