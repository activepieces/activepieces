import {
  Property,
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { googleBusinessCommon } from '../common/common';

export const createPost = createAction({
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Create a local post on a Google Business Profile location',
  props: {
    account: googleBusinessCommon.account,
    location: googleBusinessCommon.location,
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'The text content of the post',
      required: true,
    }),
    topicType: Property.StaticDropdown({
      displayName: 'Topic Type',
      description: 'The type of post to create',
      required: true,
      options: {
        options: [
          { label: 'Standard Post', value: 'STANDARD' },
          { label: 'Event', value: 'EVENT' },
          { label: 'Offer', value: 'OFFER' },
          { label: 'Alert', value: 'ALERT' },
          { label: 'Unspecified', value: 'LOCAL_POST_TOPIC_TYPE_UNSPECIFIED' },
        ],
      },
      defaultValue: 'STANDARD',
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'Language code for the post (e.g., en-US, en-GB)',
      required: false,
      defaultValue: 'en-US',
    }),
    mediaSourceUrl: Property.ShortText({
      displayName: 'Media Source URL',
      description: 'Public URL of an image to include in the post',
      required: false,
    }),
    callToActionType: Property.StaticDropdown({
      displayName: 'Call to Action Type',
      description: 'Type of call-to-action button',
      required: false,
      options: {
        options: [
          { label: 'Book', value: 'BOOK' },
          { label: 'Order', value: 'ORDER' },
          { label: 'Shop', value: 'SHOP' },
          { label: 'Learn More', value: 'LEARN_MORE' },
          { label: 'Sign Up', value: 'SIGN_UP' },
          { label: 'Call', value: 'CALL' },
          { label: 'Unspecified', value: 'ACTION_TYPE_UNSPECIFIED' },
        ],
      },
    }),
    callToActionUrl: Property.ShortText({
      displayName: 'Call to Action URL',
      description: 'URL for the call-to-action button',
      required: false,
    }),
  },
  auth: googleAuth,
  async run(ctx) {
    const {
      account,
      location,
      summary,
      topicType,
      languageCode,
      mediaSourceUrl,
      callToActionType,
      callToActionUrl,
    } = ctx.propsValue;

    // Build the request body
    const body: any = {
      summary,
      topicType: topicType || 'STANDARD',
    };

    // Add language code if provided
    if (languageCode) {
      body.languageCode = languageCode;
    }

    // Add media if provided
    if (mediaSourceUrl) {
      body.media = [
        {
          mediaFormat: 'PHOTO',
          sourceUrl: mediaSourceUrl,
        },
      ];
    }

    // Add call to action if both type and URL are provided
    if (callToActionType && callToActionUrl) {
      body.callToAction = {
        actionType: callToActionType,
        url: callToActionUrl,
      };
    }

    // The location value from the dropdown is already in the format: accounts/{accountId}/locations/{locationId}
    const response = await httpClient.sendRequest({
      url: `https://mybusiness.googleapis.com/v4/${account}/${location}/localPosts`,
      method: HttpMethod.POST,
      headers: {
        Authorization: `Bearer ${(ctx.auth as OAuth2PropertyValue).access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
