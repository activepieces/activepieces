import { HttpMethod, httpClient, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { createPostActionOutputSchema } from '../output-schemas';
import { googleBusinessCommon } from '../common/common';
import { localPostUtils } from '../common/local-post';

export const createPost = createAction({
  name: 'create-post',
  outputSchema: createPostActionOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Post',
  description: 'Creates a post for a specified location.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes a local post to a Google Business Profile location, so it appears on the business listing in Search and Maps. Choose the Post Type: Standard is a plain update, Event and Offer both require a title and a start and end date, and Alert requires an alert type. A call to action button is optional, and needs a URL for every action except Call. Not idempotent: each call publishes a separate post.',
    idempotent: false,
  },
  auth: googleAuth,
  props: {
    account: googleBusinessCommon.account,
    location: googleBusinessCommon.location,
    topicType: Property.StaticDropdown({
      displayName: 'Post Type',
      description: 'The kind of post to publish.',
      required: true,
      defaultValue: 'STANDARD',
      options: { disabled: false, options: localPostUtils.topicOptions },
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'The body text of the post.',
      required: true,
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'BCP 47 language code of the post text, for example `en` or `en-GB`.',
      required: true,
      defaultValue: 'en',
    }),
    scheduledTime: Property.DateTime({
      displayName: 'Publish At',
      description:
        'Leave empty to publish immediately. Set a future time to schedule the post, which keeps it off the listing until then.',
      required: false,
    }),
    mediaSourceUrl: Property.ShortText({
      displayName: 'Photo URL',
      description:
        'Publicly accessible URL of a photo to attach. Google fetches the image, so it must not require authentication.',
      required: false,
    }),
    callToActionType: Property.StaticDropdown({
      displayName: 'Call To Action',
      description: 'Optional button shown on the post.',
      required: false,
      options: { disabled: false, options: localPostUtils.callToActionOptions },
    }),
    callToActionUrl: Property.ShortText({
      displayName: 'Call To Action URL',
      description:
        'Where the button links to. Required for every call to action except Call Now, which uses the location phone number.',
      required: false,
    }),
    eventTitle: Property.ShortText({
      displayName: 'Event / Offer Title',
      description: 'Required when the post type is Event or Offer.',
      required: false,
    }),
    eventStartDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Required for Event and Offer posts, as `YYYY-MM-DD`.',
      required: false,
    }),
    eventStartTime: Property.ShortText({
      displayName: 'Start Time',
      description:
        'Optional time of day as `HH:mm` in 24-hour form. Interpreted in the location time zone, so no offset is sent.',
      required: false,
    }),
    eventEndDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Required for Event and Offer posts, as `YYYY-MM-DD`.',
      required: false,
    }),
    eventEndTime: Property.ShortText({
      displayName: 'End Time',
      description: 'Optional time of day as `HH:mm` in 24-hour form.',
      required: false,
    }),
    offerCouponCode: Property.ShortText({
      displayName: 'Coupon Code',
      required: false,
    }),
    offerRedeemOnlineUrl: Property.ShortText({
      displayName: 'Redeem Online URL',
      required: false,
    }),
    offerTermsConditions: Property.LongText({
      displayName: 'Terms And Conditions',
      required: false,
    }),
    alertType: Property.StaticDropdown({
      displayName: 'Alert Type',
      description: 'Required when the post type is Alert.',
      required: false,
      options: { disabled: false, options: localPostUtils.alertTypeOptions },
    }),
  },
  async run(ctx) {
    const { account, location, ...content } = ctx.propsValue;

    await propsValidation.validateZod(ctx.propsValue, localPostUtils.scheduleValidation);
    localPostUtils.assertValid(content);

    const response = await httpClient.sendRequest({
      url: `${localPostUtils.baseUrl}/${account}/${location}/localPosts`,
      method: HttpMethod.POST,
      headers: {
        Authorization: `Bearer ${ctx.auth.access_token}`,
      },
      body: localPostUtils.buildContent(content),
    });

    return response.body;
  },
});
