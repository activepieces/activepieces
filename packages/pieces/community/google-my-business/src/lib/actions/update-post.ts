import { HttpMethod, httpClient, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { googleAuth } from '../..';
import { updatePostActionOutputSchema } from '../output-schemas';
import { localPostUtils } from '../common/local-post';

export const updatePost = createAction({
  name: 'update-post',
  outputSchema: updatePostActionOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Post',
  description: 'Change the text, photo, button or details of a post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing local post on a Google Business Profile location, identified by its full resource name. Only the fields you set are sent, and Google replaces each of those fields wholesale. Leave a field empty to keep it as it is. Idempotent: sending the same values again leaves the post in the same state.',
    idempotent: true,
  },
  auth: googleAuth,
  propertyGroups: [
    {
      key: 'content',
      display: 'section',
      label: 'Content',
      icon: 'text',
      props: ['postName', 'summary', 'mediaSourceUrl', 'languageCode'],
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
    postName: Property.ShortText({
      displayName: 'Post ID',
      description: 'Paste the whole name field from Create Post or List Posts.',
      placeholder: 'accounts/123/locations/456/localPosts/789',
      required: true,
    }),
    summary: Property.LongText({
      displayName: 'Post Text',
      description: 'Leave empty to keep the current text.',
      required: false,
    }),
    mediaSourceUrl: Property.ShortText({
      displayName: 'Photo URL',
      description: 'Replaces every photo on the post. Must open without a login.',
      placeholder: 'https://example.com/photo.jpg',
      required: false,
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'Language of the post text, like en or en-GB.',
      placeholder: 'en',
      required: false,
    }),
    eventTitle: Property.ShortText({
      displayName: 'Title',
      description: 'Replaces the whole event, so fill in every field you want kept.',
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
      description: 'Replaces the whole offer, so fill in every field you want kept.',
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
      description: 'Choosing a type replaces the current button.',
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
      description: 'Reschedule the post to a future time.',
      advanced: true,
      required: false,
    }),
  },
  async run(ctx) {
    const { postName, ...content } = ctx.propsValue;

    await propsValidation.validateZod(ctx.propsValue, {
      postName: z.string().check(z.regex(localPostUtils.postNamePattern)),
      ...localPostUtils.scheduleValidation,
    });
    localPostUtils.assertValid(content);

    const body = localPostUtils.buildContent(content);
    const updateMask = Object.keys(body);
    if (updateMask.length === 0) {
      throw new Error('Set at least one field to update.');
    }

    const response = await httpClient.sendRequest({
      url: `${localPostUtils.baseUrl}/${postName}`,
      method: HttpMethod.PATCH,
      headers: {
        Authorization: `Bearer ${ctx.auth.access_token}`,
      },
      queryParams: {
        updateMask: updateMask.join(','),
      },
      body,
    });

    return response.body;
  },
});
