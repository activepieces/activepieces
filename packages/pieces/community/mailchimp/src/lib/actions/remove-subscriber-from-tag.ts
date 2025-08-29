import { mailchimpCommon } from '../common';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import crypto from 'crypto';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../auth';

export const removeSubscriberFromTag = createAction({
  auth: mailchimpAuth,
  name: 'remove_subscriber_to_tag',
  displayName: 'Remove Subscriber from a tag',
  description: 'Removes a subscriber from a tag',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the subscriber',
      required: true,
    }),
    tag_names: Property.Array({
      displayName: 'Tag Name',
      description: 'Tag name to add to the subscriber',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, email, tag_names } = context.propsValue;
    const { access_token } = context.auth;

    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');
    const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(
      access_token
    );
    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${list_id}/members/${subscriberHash}/tags`;

    const tags = tag_names.map((tag_name) => ({
      name: tag_name,
      status: 'inactive', // equal to removing a tag
    }));

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
      body: { tags },
    };

    await httpClient.sendRequest(request);

    return {
      success: true,
    };
  },
});
