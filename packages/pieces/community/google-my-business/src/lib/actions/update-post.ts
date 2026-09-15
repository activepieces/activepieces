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
  description: 'Updates a post for a specified location.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing local post on a Google Business Profile location, identified by its full resource name. Only the fields you set are sent, and Google replaces each of those fields wholesale. Leave a field empty to keep it as it is. Idempotent: sending the same values again leaves the post in the same state.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    postName: Property.ShortText({
      displayName: 'Post Name',
      description:
        'Full resource name of the post, as `accounts/{account}/locations/{location}/localPosts/{post}`.',
      required: true,
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'New body text. Leave empty to keep the current text.',
      required: false,
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'BCP 47 language code, for example `en`.',
      required: false,
    }),
    scheduledTime: Property.DateTime({
      displayName: 'Publish At',
      description: 'Reschedule the post to a future time.',
      required: false,
    }),
    mediaSourceUrl: Property.ShortText({
      displayName: 'Photo URL',
      description:
        'Publicly accessible photo URL. Setting this replaces every photo already on the post.',
      required: false,
    }),
    callToActionType: Property.StaticDropdown({
      displayName: 'Call To Action',
      required: false,
      options: { disabled: false, options: localPostUtils.callToActionOptions },
    }),
    callToActionUrl: Property.ShortText({
      displayName: 'Call To Action URL',
      description: 'Required whenever a call to action other than Call Now is set.',
      required: false,
    }),
    eventTitle: Property.ShortText({
      displayName: 'Event / Offer Title',
      required: false,
    }),
    eventStartDate: Property.ShortText({
      displayName: 'Start Date',
      description: '`YYYY-MM-DD`. Must be given together with an End Date.',
      required: false,
    }),
    eventStartTime: Property.ShortText({
      displayName: 'Start Time',
      description: '`HH:mm` in 24-hour form.',
      required: false,
    }),
    eventEndDate: Property.ShortText({
      displayName: 'End Date',
      description: '`YYYY-MM-DD`. Must be given together with a Start Date.',
      required: false,
    }),
    eventEndTime: Property.ShortText({
      displayName: 'End Time',
      description: '`HH:mm` in 24-hour form.',
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
