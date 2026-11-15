import { propsValidation } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { googleAuth } from '../..';
import { gmbApi } from '../common/client';
import { listReviewsActionOutputSchema } from '../output-schemas';

export const listReviews = createAction({
  name: 'list-reviews',
  outputSchema: listReviewsActionOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Reviews',
  description: 'Lists the customer reviews of a location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists customer reviews of a Google Business Profile location with reviewer, star rating (ONE to FIVE), comment, timestamps and any existing owner reply, plus the location average rating and total review count. Each review has a reviewId to pass to Get Review, Reply to Review or Delete Review Reply. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    account_id: gmbApi.props.accountId(),
    location_id: gmbApi.props.locationId(),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort order. Google defaults to newest first when unset.',
      required: false,
      options: {
        options: [
          { label: 'Newest first', value: 'updateTime desc' },
          { label: 'Lowest rating first', value: 'rating' },
          { label: 'Highest rating first', value: 'rating desc' },
        ],
      },
    }),
    max_results: gmbApi.props.maxResults(),
  },
  async run(ctx) {
    await propsValidation.validateZod(ctx.propsValue, {
      max_results: z.optional(z.number().check(z.gte(1))),
    });
    const { account_id, location_id, order_by, max_results } = ctx.propsValue;
    const parent = gmbApi.resourceNames.v4Location({ account: account_id, location: location_id });
    const { items, nextPageToken, lastPage } = await gmbApi.paginate({
      accessToken: ctx.auth.access_token,
      url: `${gmbApi.hosts.v4}/${parent}/reviews`,
      query: new URLSearchParams(isNil(order_by) ? {} : { orderBy: order_by }),
      itemsKey: 'reviews',
      pageSize: 50,
      maxResults: max_results ?? 100,
    });
    return {
      reviews: items,
      count: items.length,
      average_rating: lastPage['averageRating'] ?? null,
      total_review_count: lastPage['totalReviewCount'] ?? 0,
      ...(isNil(nextPageToken) ? {} : { next_page_token: nextPageToken }),
    };
  },
});
