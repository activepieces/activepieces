import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzProps } from '../common/props';
import { reviewflowzSearch } from '../common/search';

export const findReviewRequestAction = createAction({
  auth: reviewflowzAuth,
  name: 'find_review_request',
  classification: 'SEARCH',
  displayName: 'Find Review Request',
  description: "Finds a customer's latest review request and what happened to it: sent, opened, clicked, failed.",
  audience: 'both',
  aiMetadata: {
    description:
      "Find a contact's latest Reviewflowz review request (optionally in one campaign) and its state: sent, opened, clicked, failed. Needs the contact ID from Find Contact or Send Review Request. Read-only.",
    idempotent: true,
  },
  props: {
    contact: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Like con_00000000-0000-4000-8000-000000000001, from Find Contact or Send Review Request.',
      required: true,
    }),
    campaign: reviewflowzProps.optionalCampaign(),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    return reviewflowzSearch.first(
      await reviewflowzSearch.list({
        auth,
        path: '/invitations',
        query: { contact: input.contact, campaign: input.campaign, limit: 1 },
      }),
    );
  },
});
