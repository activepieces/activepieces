import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { opportunityOutputSchema } from '../../common/output-schemas';
import { OpportunityValue, UpdateOpportunityParams } from '../../common/types';

export const aiUpdateOpportunity = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_update_opportunity',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Updates an opportunity.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an existing Capsule CRM opportunity by Opportunity ID and returns it. Only the fields you give are changed. Move it through the pipeline with Milestone ID (from List Milestones). Amount and Currency must be given together. Repeating the same call leaves the opportunity in the same state.',
    idempotent: true,
  },
  outputSchema: opportunityOutputSchema,
  props: {
    opportunity_id: Property.ShortText({ displayName: 'Opportunity ID', description: 'Numeric ID of the opportunity.', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'New name.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New description; replaces the existing one.', required: false }),
    milestone_id: Property.ShortText({ displayName: 'Milestone ID', description: 'Numeric milestone ID from List Milestones.', required: false }),
    amount: Property.Number({ displayName: 'Amount', description: 'New deal value.', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'ISO 4217 code. Required with Amount.', required: false }),
    probability: Property.Number({ displayName: 'Probability', description: 'Win probability 0-100.', required: false }),
    expected_close_on: Property.ShortText({ displayName: 'Expected Close Date', description: 'YYYY-MM-DD.', required: false }),
    owner_id: Property.ShortText({ displayName: 'Owner User ID', description: 'Numeric user ID from List Users.', required: false }),
  },
  async run({ auth, propsValue }) {
    const params: UpdateOpportunityParams = {
      name: capsuleCrmClient.optionalText(propsValue.name),
      description: capsuleCrmClient.optionalText(propsValue.description),
      expectedCloseOn: capsuleCrmClient.isoDate({ value: propsValue.expected_close_on, label: 'Expected Close Date' }),
      probability: probabilityOf(propsValue.probability),
    };
    const milestoneId = capsuleCrmClient.optionalId(propsValue.milestone_id);
    if (milestoneId !== undefined) params.milestone = { id: milestoneId };
    const ownerId = capsuleCrmClient.optionalId(propsValue.owner_id);
    if (ownerId !== undefined) params.owner = { id: ownerId };
    const value = valueOf({ amount: propsValue.amount, currency: propsValue.currency });
    if (value) params.value = value;
    const changes = Object.values(params).filter((item) => item !== undefined);
    if (changes.length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return capsuleCrmClient.updateOpportunity({ auth, opportunityId: capsuleCrmClient.segment(propsValue.opportunity_id), params });
  },
});

function valueOf({ amount, currency }: { amount: unknown; currency: unknown }): OpportunityValue | undefined {
  const code = capsuleCrmClient.optionalText(currency);
  const hasAmount = typeof amount === 'number' && Number.isFinite(amount);
  if (!hasAmount && code === undefined) {
    return undefined;
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || code === undefined) {
    throw new Error('Give Amount and Currency together.');
  }
  if (!/^[A-Za-z]{3}$/.test(code)) {
    throw new Error('Currency must be a 3-letter ISO 4217 code, for example USD.');
  }
  return { amount, currency: code.toUpperCase() };
}

function probabilityOf(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('Probability must be a number from 0 to 100.');
  }
  return value;
}
