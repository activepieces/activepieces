import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { productReviewOutputSchema } from '../../output-schemas';

export const wooAiUpdateProductReview = createAction({
  name: 'update_product_review',
  classification: 'WRITE',
  displayName: 'Moderate Product Review',
  description: 'Approve, hold, mark as spam or trash a product review.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the moderation status of one product review: approve it, put it on hold, mark or unmark it as spam, or move it to or from the trash. The review text and rating cannot be changed here. Find review ids with list_product_reviews.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: productReviewOutputSchema,
  props: {
    review_id: Property.Number({
      displayName: 'Review ID',
      description: 'Id of the review.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New moderation status.',
      required: true,
      options: {
        options: [
          { label: 'Approve', value: 'approved' },
          { label: 'Hold (unapprove)', value: 'hold' },
          { label: 'Mark as spam', value: 'spam' },
          { label: 'Not spam', value: 'unspam' },
          { label: 'Move to trash', value: 'trash' },
          { label: 'Restore from trash', value: 'untrash' },
        ],
      },
    }),
  },
  async run(context) {
    const { review_id, status } = context.propsValue;
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/products/reviews/${wooClient.encodeId(review_id)}`,
      body: { status },
    });
  },
});
