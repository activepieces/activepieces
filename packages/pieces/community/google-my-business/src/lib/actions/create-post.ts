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
  description: 'Publish an update, event, offer or alert on a location.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes a local post to a Google Business Profile location, so it appears on the business listing in Search and Maps. Choose the Post Type: Standard is a plain update, Event and Offer both require a title and a start and end date, and Alert requires an alert type. A call to action button is optional, and needs a URL for every action except Call. Not idempotent: each call publishes a separate post.',
    idempotent: false,
  },
  auth: googleAuth,
  propertyGroups: [
    {
      key: 'business',
      display: 'section',
      label: 'Business',
      icon: 'location',
      props: ['account', 'location'],
    },
    {
      key: 'content',
      display: 'section',
      label: 'Content',
      icon: 'text',
      props: ['topicType', 'summary', 'mediaSourceUrl', 'languageCode', 'alertType'],
    },
    {
      key: 'event',
      display: 'section',
      label: 'Event and Offer Details',
      icon: 'calendar',
      props: ['eventTitle', 'eventStartDate', 'eventStartTime', 'eventEndDate', 'eventEndTime'],
    },
    {
      key: 'offer',
      display: 'section',
      label: 'Offer Details',
      icon: 'tag',
      props: ['offerCouponCode', 'offerRedeemOnlineUrl', 'offerTermsConditions'],
    },
    {
      key: 'button',
      display: 'section',
      label: 'Button',
      icon: 'send',
      props: ['callToActionType', 'callToActionUrl'],
    },
  ],
  props: {
    account: googleBusinessCommon.account,
    location: googleBusinessCommon.location,
    topicType: Property.StaticDropdown({
      displayName: 'Post Type',
      required: true,
      defaultValue: 'STANDARD',
      display: 'cards',
      options: { disabled: false, options: localPostUtils.topicOptions },
    }),
    summary: Property.LongText({
      displayName: 'Post Text',
      placeholder: 'We are open late this Friday!',
      required: true,
    }),
    mediaSourceUrl: Property.ShortText({
      displayName: 'Photo URL',
      description: 'A public image link. Google must open it without a login.',
      placeholder: 'https://example.com/photo.jpg',
      required: false,
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'Language of the post text, like en or en-GB.',
      required: true,
      defaultValue: 'en',
    }),
    alertType: Property.StaticDropdown({
      displayName: 'Alert Type',
      description: 'Required for Alert posts.',
      required: false,
      options: { disabled: false, options: localPostUtils.alertTypeOptions },
    }),
    eventTitle: Property.ShortText({
      displayName: 'Title',
      description: 'Required for Event and Offer posts, with both dates.',
      required: false,
    }),
    eventStartDate: Property.ShortText({
      displayName: 'Start Date',
      placeholder: '2026-12-31',
      width: 'half',
      required: false,
    }),
    eventStartTime: Property.ShortText({
      displayName: 'Start Time',
      description: '24-hour clock, location time zone.',
      placeholder: '09:00',
      width: 'half',
      required: false,
    }),
    eventEndDate: Property.ShortText({
      displayName: 'End Date',
      placeholder: '2026-12-31',
      width: 'half',
      required: false,
    }),
    eventEndTime: Property.ShortText({
      displayName: 'End Time',
      description: '24-hour clock, location time zone.',
      placeholder: '17:00',
      width: 'half',
      required: false,
    }),
    offerCouponCode: Property.ShortText({
      displayName: 'Coupon Code',
      placeholder: 'SAVE20',
      required: false,
    }),
    offerRedeemOnlineUrl: Property.ShortText({
      displayName: 'Redeem Online URL',
      placeholder: 'https://example.com/offer',
      required: false,
    }),
    offerTermsConditions: Property.LongText({
      displayName: 'Terms and Conditions',
      required: false,
    }),
    callToActionType: Property.StaticDropdown({
      displayName: 'Button Type',
      required: false,
      options: { disabled: false, options: localPostUtils.callToActionOptions },
    }),
    callToActionUrl: Property.ShortText({
      displayName: 'Button Link',
      description: 'Required for every button except Call Now, which dials the location.',
      placeholder: 'https://example.com',
      required: false,
    }),
    scheduledTime: Property.DateTime({
      displayName: 'Publish At',
      description: 'Leave empty to publish now.',
      advanced: true,
      required: false,
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
