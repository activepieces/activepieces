import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';

export const replyToReviewAction = createAction({
  auth: reviewflowzAuth,
  name: 'reply_to_review',
  classification: 'WRITE',
  displayName: 'Reply to Review',
  description: 'Posts your reply on the platform, or saves it as a draft to check in Reviewflowz.',
  audience: 'both',
  aiMetadata: {
    description:
      "Post a reply to a review on its platform (Google, Tripadvisor...) through Reviewflowz, or save it as a draft in the reply queue. The text is used as given; use Write Reply With AI to have Reviewflowz's agent write it. Posting replaces the review's current reply, so a retry posts the same text again.",
    idempotent: true,
  },
  props: {
    review: reviewflowzProps.reviewId(),
    text: Property.LongText({ displayName: 'Reply', required: true }),
    publish: Property.Checkbox({
      displayName: 'Post it now',
      description: 'Off saves it as a draft in the reply queue instead.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    return reviewflowzApi.call({
      auth,
      method: HttpMethod.POST,
      path: `/reviews/${encodeURIComponent(String(input.review))}/reply`,
      body: { text: input.text, publish: input.publish !== false },
    });
  },
});
