import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { googleAuth } from '../..';
import { HttpMethod, httpClient, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const createReply = createAction({
  name: 'create-reply',
  displayName: 'Create or Update Reply',
  description: 'Create or update a reply to a review if it already exists',
  props: {
    reviewName: Property.ShortText({
      displayName: 'Review Name',
      description: 'You can find the review name from new review trigger',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Comment to be added to the review',
      required: true,
    }),
  },
  auth: googleAuth,
  async run(ctx) {
    const { reviewName, comment } = ctx.propsValue;

    await propsValidation.validateZod(ctx.propsValue, {
      reviewName: z.string().regex(/accounts\/.*\/locations\/.*\/reviews\/.*/),
    });

    const response = await httpClient.sendRequest({
      url: ` https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
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
