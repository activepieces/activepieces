import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { closeOpportunityOutputSchema } from '../../common/output-schemas';
import { salesEntities } from '../../common/sales-entities';

export const aiCloseOpportunityAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_close_opportunity',
  classification: 'WRITE',
  displayName: 'Close Opportunity',
  description: 'Closes an opportunity as won or lost.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Closes an open Dynamics 365 opportunity as won or lost with a closing subject, optional actual revenue and status reason (won 3; lost 4 Canceled or 5 Out-Sold). Not idempotent: a closed opportunity cannot be closed again.',
    idempotent: false,
  },
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'GUID of the open opportunity.',
      required: true,
    }),
    outcome: Property.StaticDropdown<string>({
      displayName: 'Outcome',
      required: true,
      options: { disabled: false, options: [{ label: 'Won', value: 'won' }, { label: 'Lost', value: 'lost' }] },
    }),
    subject: Property.ShortText({
      displayName: 'Closing Subject',
      description: 'Short closing note.',
      required: true,
    }),
    actualRevenue: Property.Number({
      displayName: 'Actual Revenue',
      required: false,
    }),
    statusReason: Property.ShortText({
      displayName: 'Status Reason',
      description: 'Optional status reason option value; defaults to 3 for won and 4 for lost.',
      required: false,
    }),
    closeDate: Property.ShortText({
      displayName: 'Close Date',
      description: 'Optional date, for example 2026-12-31.',
      required: false,
    }),
  },
  outputSchema: closeOpportunityOutputSchema,
  async run(context) {
    const { opportunityId, outcome, subject, actualRevenue, statusReason, closeDate } = context.propsValue;
    if (outcome !== 'won' && outcome !== 'lost') {
      throw new Error('Outcome must be won or lost.');
    }
    const id = odata.requireGuid({ value: opportunityId, label: 'Opportunity ID' });
    const status = salesEntities.statusReason({ value: statusReason, fallback: outcome === 'won' ? 3 : 4 });
    const date = closeDate?.trim() || undefined;
    await makeClient(context.auth).closeOpportunity({
      opportunityId: id,
      outcome,
      status,
      subject,
      actualRevenue: actualRevenue === undefined || actualRevenue === null ? undefined : salesEntities.readNumber({ value: actualRevenue, label: 'Actual Revenue' }),
      closeDate: date === undefined ? undefined : salesEntities.readDate({ value: date, label: 'Close Date' }),
    });
    return { success: true, opportunityId: id, outcome, statusReason: status };
  },
});
