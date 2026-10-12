import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listProductReviewsOutputSchema } from '../../output-schemas';

export const wooAiListProductReviews = createAction({
  name: 'list_product_reviews',
  classification: 'SEARCH',
  displayName: 'List Product Reviews',
  description: 'List product reviews, including ones waiting for moderation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists customer product reviews with their rating, text, reviewer and moderation status. Status defaults to all, so reviews on hold or marked as spam are included; use it to find a review id for update_product_review. Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listProductReviewsOutputSchema,
  props: {
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Only return reviews of this product.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Moderation status to return. Defaults to all.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Approved', value: 'approved' },
          { label: 'On hold (awaiting moderation)', value: 'hold' },
          { label: 'Spam', value: 'spam' },
          { label: 'Trash', value: 'trash' },
        ],
      },
    }),
    reviewer_email: Property.ShortText({
      displayName: 'Reviewer Email',
      description: 'Only return reviews written with this email address.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text to match against the review content.',
      required: false,
    }),
    page: wooProps.pageProp(),
    per_page: wooProps.perPageProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const paging = await wooValues.paging({ page: props.page, perPage: props.per_page });
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/products/reviews',
      queryParams: {
        product: props.product_id,
        status: props.status ?? 'all',
        reviewer_email: wooValues.nonEmpty(props.reviewer_email),
        search: wooValues.nonEmpty(props.search),
        ...paging,
      },
    });
  },
});
