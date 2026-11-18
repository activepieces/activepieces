import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';

export const writeReplyWithAiAction = createAction({
  auth: reviewflowzAuth,
  name: 'write_reply_with_ai',
  classification: 'WRITE',
  displayName: 'Write Reply With AI',
  description: 'Has your reply agent write a reply to a review. Nothing is posted.',
  audience: 'both',
  aiMetadata: {
    description:
      "Have the account's Reviewflowz reply agent (its tone, rules and examples) write a reply to a review. Nothing is posted: the text is returned and, by default, saved as the review's draft for someone to approve. Each call writes a new draft.",
    idempotent: false,
  },
  props: {
    review: reviewflowzProps.reviewId(),
    agent: reviewflowzProps.replyAgent(),
    save: Property.Checkbox({
      displayName: "Save it as the review's draft",
      description: 'On puts it in the reply queue for someone to approve. Off only returns the text, for the flow to use.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    return reviewflowzApi.call({
      auth,
      method: HttpMethod.POST,
      path: `/reviews/${encodeURIComponent(String(input.review))}/reply/draft`,
      body: { save: input.save !== false, ...(input.agent ? { agent: input.agent } : {}) },
    });
  },
});
