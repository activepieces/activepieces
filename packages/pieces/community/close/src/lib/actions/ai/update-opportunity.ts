import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

function valuePeriodOf(value: unknown): string | undefined {
  const period = closeClient.optionalText(value);
  if (period === undefined) return undefined;
  if (!['one_time', 'monthly', 'annual'].includes(period)) throw new Error('Value Period must be one_time, monthly or annual.');
  return period;
}

function opportunityBody({ props }: { props: Record<string, unknown> }): Record<string, unknown> {
  const body: Record<string, unknown> = {
    status_id: closeClient.optionalCloseId({ value: props['statusId'], label: 'Status ID', prefix: 'stat' }),
    contact_id: closeClient.optionalCloseId({ value: props['contactId'], label: 'Contact ID', prefix: 'cont' }),
    user_id: closeClient.optionalCloseId({ value: props['userId'], label: 'Owner User ID', prefix: 'user' }),
    value: closeClient.parseInteger({ value: props['valueCents'], label: 'Value (cents)', min: 0, max: Number.MAX_SAFE_INTEGER }),
    value_period: valuePeriodOf(props['valuePeriod']),
    confidence: closeClient.parseInteger({ value: props['confidence'], label: 'Confidence %', min: 0, max: 100 }),
    note: closeClient.clearableText(props['note']),
    date_won: closeClient.isoDate({ value: props['expectedCloseDate'], label: 'Close Date' }),
    ...closeClient.customFieldsBody({ value: props['customFields'] }),
  };
  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
}

const updateOpportunity = createAction({
  auth: closeAuth,
  name: 'update_opportunity',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Change fields on an opportunity.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates a Close opportunity (oppo_...). Only the fields you pass change; an empty Note clears it. Value is a whole number of cents. Set Status ID to a won or lost status (from List Pipelines) to close the deal. Repeating the same update gives the same result.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.opportunity,
  props: {
    opportunityId: Property.ShortText({ displayName: 'Opportunity ID', description: 'oppo_...', required: true }),
    statusId: Property.ShortText({ displayName: 'Status ID', description: 'Opportunity status ID (stat_...). Use List Pipelines to find IDs.', required: false }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'Contact on the lead (cont_...).', required: false }),
    userId: Property.ShortText({ displayName: 'Owner User ID', description: 'User who owns the opportunity (user_...).', required: false }),
    valueCents: Property.Number({ displayName: 'Value (cents)', description: 'Whole number of cents, e.g. 340000 for 3,400.00.', required: false }),
    valuePeriod: Property.ShortText({ displayName: 'Value Period', description: 'one_time, monthly or annual.', required: false }),
    confidence: Property.Number({ displayName: 'Confidence %', description: '0 to 100.', required: false }),
    note: Property.LongText({ displayName: 'Note', description: 'Pass an empty string to clear it.', required: false }),
    expectedCloseDate: Property.ShortText({ displayName: 'Close Date', description: 'Expected (or won) close date, e.g. 2026-11-30.', required: false }),
    customFields: Property.Json({ displayName: 'Custom Fields', description: 'Object of custom field ID (cf_...) to value.', required: false }),
  },
  async run({ auth, propsValue }) {
    const opportunityId = closeClient.closeId({ value: propsValue.opportunityId, label: 'Opportunity ID', prefix: 'oppo' });
    const body = opportunityBody({ props: propsValue });
    if (Object.keys(body).length === 0) throw new Error('Pass at least one field to update.');
    const raw = await closeClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/opportunity/${closeClient.pathId(opportunityId)}/`,
      body,
    });
    return closeMappers.opportunity(raw);
  },
});

export { updateOpportunity };
