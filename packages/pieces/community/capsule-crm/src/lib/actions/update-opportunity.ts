import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS } from '../common';

export const updateOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity in Capsule CRM.',
  props: {
    opportunityId: Property.Number({
      displayName: 'Opportunity ID',
      description: 'ID of the opportunity to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name of the opportunity',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the opportunity',
      required: false,
    }),
    milestoneId: Property.Number({
      displayName: 'Milestone ID',
      description: 'ID of the milestone/stage for this opportunity',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Value',
      description: 'Monetary value of the opportunity',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g., USD, EUR, GBP)',
      required: false,
    }),
    expectedCloseOn: Property.ShortText({
      displayName: 'Expected Close Date',
      description: 'Expected close date in YYYY-MM-DD format',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'Probability of closing (0-100)',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (days)',
      description: 'Expected duration in days',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'ID of the user who owns this opportunity',
      required: false,
    }),
    teamId: Property.Number({
      displayName: 'Team ID',
      description: 'ID of the team responsible for this opportunity',
      required: false,
    }),
  },
  async run(context) {
    const {
      opportunityId,
      name,
      description,
      milestoneId,
      value,
      currency,
      expectedCloseOn,
      probability,
      duration,
      ownerId,
      teamId
    } = context.propsValue;

    // Build the opportunity object with only provided fields
    const opportunity: any = {};

    if (name) opportunity.name = name;
    if (description) opportunity.description = description;
    if (milestoneId) opportunity.milestone = { id: milestoneId };
    if (expectedCloseOn) opportunity.expectedCloseOn = expectedCloseOn;
    if (probability !== undefined) opportunity.probability = probability;
    if (duration !== undefined) opportunity.duration = duration;
    if (ownerId) opportunity.owner = { id: ownerId };
    if (teamId) opportunity.team = { id: teamId };

    if (value !== undefined) {
      opportunity.value = {
        amount: value,
        currency: currency || 'USD',
      };
    }

    const requestBody = { opportunity };

    const response = await makeApiCall(
      context.auth,
      `${API_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
      'PUT',
      requestBody
    );

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`Failed to update opportunity: ${response.status} ${response.body?.message || ''}`);
    }
  },
});