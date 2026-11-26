import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { opportunityOutputSchema } from '../../common/output-schemas';
import { CreateOpportunityParams } from '../../common/types';

export const aiCreateOpportunity = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_create_opportunity',
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Creates an opportunity.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new Capsule CRM opportunity (deal) for a party and returns it with its id. Party ID comes from Search Contacts, Milestone ID from List Milestones. Amount and Currency must be given together. If Party ID is a person who belongs to an organisation, Capsule saves the organisation as the opportunity party (check party in the result). Capsule needs an owner and/or team; leave Owner User ID empty to let Capsule apply its default (assumed to be the connected user, unverified). Not idempotent: each call creates another opportunity.',
    idempotent: false,
  },
  outputSchema: opportunityOutputSchema,
  props: {
    party_id: Property.ShortText({ displayName: 'Party ID', description: 'Numeric ID of the person or organisation the deal is with.', required: true }),
    milestone_id: Property.ShortText({ displayName: 'Milestone ID', description: 'Numeric milestone ID from List Milestones.', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Short name of the opportunity.', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'More details.', required: false }),
    amount: Property.Number({ displayName: 'Amount', description: 'Deal value, for example 5000.', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'ISO 4217 code, for example USD. Required with Amount.', required: false }),
    expected_close_on: Property.ShortText({ displayName: 'Expected Close Date', description: 'YYYY-MM-DD.', required: false }),
    probability: Property.Number({ displayName: 'Probability', description: 'Win probability 0-100. Defaults to the milestone probability.', required: false }),
    owner_id: Property.ShortText({ displayName: 'Owner User ID', description: 'Numeric user ID from List Users.', required: false }),
  },
  async run({ auth, propsValue }) {
    const params: CreateOpportunityParams = {
      name: capsuleCrmClient.requiredText({ value: propsValue.name, label: 'Name' }),
      party: { id: capsuleCrmClient.requiredId({ value: propsValue.party_id, label: 'Party ID' }) },
      milestone: { id: capsuleCrmClient.requiredId({ value: propsValue.milestone_id, label: 'Milestone ID' }) },
      description: capsuleCrmClient.optionalText(propsValue.description),
      expectedCloseOn: capsuleCrmClient.isoDate({ value: propsValue.expected_close_on, label: 'Expected Close Date' }),
      probability: capsuleCrmClient.probability(propsValue.probability),
    };
    const value = capsuleCrmClient.opportunityValue({ amount: propsValue.amount, currency: propsValue.currency });
    if (value) params.value = value;
    const ownerId = capsuleCrmClient.optionalId(propsValue.owner_id);
    if (ownerId !== undefined) params.owner = { id: ownerId };
    return capsuleCrmClient.createOpportunity({ auth, params });
  },
});

