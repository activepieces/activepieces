import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { HttpMethod, httpClient, propsValidation } from '@activepieces/pieces-common';
import * as z from 'zod/mini'

export const createReply = createAction({
  name: 'create-reply',
  classification: 'WRITE',
  displayName: 'Create or Update Reply',
  description: 'Reply to a review, or replace the reply already posted.',
  audience: 'human',
  aiMetadata: { description: 'Posts the business owner\'s reply to a specific Google Business Profile review, or overwrites the existing reply if one is already present. Use to respond to customer reviews; safe to repeat since it upserts on the review name. Requires the full review resource name in the form accounts/{account}/locations/{location}/reviews/{review}.', idempotent: true },
  props: {
    reviewName: Property.ShortText({
      displayName: 'Review ID',
      description: 'Paste the whole name field from the New Review trigger.',
      placeholder: 'accounts/123/locations/456/reviews/789',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Shown publicly under the review.',
      placeholder: 'Thanks for visiting us!',
      required: true,
    }),
  },
  auth: googleAuth,
  async run(ctx) {
    const { reviewName, comment } = ctx.propsValue;

    await propsValidation.validateZod(ctx.propsValue, {
      reviewName: z.string().check(z.regex(/accounts\/.*\/locations\/.*\/reviews\/.*/)),
    });

    const response = await httpClient.sendRequest({
      url: `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      method: HttpMethod.PUT,
      headers: {
        Authorization: `Bearer ${ctx.auth.access_token}`,
      },
      body: {
        comment,
      },
    });
    return response;
  },
});
