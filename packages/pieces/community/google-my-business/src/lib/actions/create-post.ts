import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { googleBusinessCommon } from '../common/common';

export const createPost = createAction({
  name: 'create-post',
  displayName: 'Create Post',
  description: 'Create a new post on your Google My Business location',
  auth: googleAuth,
  props: {
    account: googleBusinessCommon.account,
    location: googleBusinessCommon.location,
    summary: Property.LongText({
      displayName: 'Post Content',
      description: 'The text content of the post (1500 characters max)',
      required: true,
    }),
    topicType: Property.StaticDropdown({
      displayName: 'Post Type',
      description: 'The type of post to create',
      required: false,
      defaultValue: 'STANDARD',
      options: {
        disabled: false,
        options: [
          { label: 'Standard Update', value: 'STANDARD' },
          { label: 'Event', value: 'EVENT' },
          { label: 'Offer', value: 'OFFER' },
        ],
      },
    }),
    actionType: Property.StaticDropdown({
      displayName: 'Call to Action',
      description: 'Optional call-to-action button',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'None', value: '' },
          { label: 'Learn More', value: 'LEARN_MORE' },
          { label: 'Book', value: 'BOOK' },
          { label: 'Order Online', value: 'ORDER' },
          { label: 'Shop', value: 'SHOP' },
          { label: 'Sign Up', value: 'SIGN_UP' },
          { label: 'Call', value: 'CALL' },
        ],
      },
    }),
    actionUrl: Property.ShortText({
      displayName: 'Action URL',
      description: 'URL for the call-to-action button (required if a call to action is selected)',
      required: false,
    }),
  },
  async run(ctx) {
    const { account, location, summary, topicType, actionType, actionUrl } =
      ctx.propsValue;

    const body: Record<string, unknown> = {
      languageCode: 'en',
      summary,
      topicType: topicType || 'STANDARD',
    };

    if (actionType) {
      body.callToAction = {
        actionType,
        url: actionUrl || '',
      };
    }

    const response = await httpClient.sendRequest({
      url: `https://mybusiness.googleapis.com/v4/${account}/${location}/localPosts`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: ctx.auth.access_token,
      },
      body,
    });
    return response.body;
  },
});
