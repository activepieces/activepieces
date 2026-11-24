import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { closeOpportunityOutputSchema } from '../../common/output-schemas';
import { dynamicsProps } from '../../common/props';
import { salesEntities } from '../../common/sales-entities';

export const loseOpportunityAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'lose_opportunity',
  classification: 'WRITE',
  displayName: 'Lose Opportunity',
  description: 'Closes an opportunity as lost with a status reason.',
  audience: 'human',
  aiMetadata: {
    description:
      'Closes an open Dynamics 365 opportunity as lost. Not idempotent: a closed opportunity cannot be closed again.',
    idempotent: false,
  },
  props: {
    opportunityId: dynamicsProps.fixedRecordDropdown({
      entitySet: 'opportunities',
      displayName: 'Opportunity',
      description: 'The open opportunity to close. Type to search by name, or map an opportunity ID.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Closing Subject',
      description: 'A short note saved on the opportunity close record.',
      required: true,
      defaultValue: 'Opportunity lost',
    }),
    statusReason: Property.StaticDropdown<string>({
      displayName: 'Status Reason',
      description: 'Pick a reason, or map the option value of a custom status reason.',
      required: true,
      defaultValue: '4',
      options: {
        disabled: false,
        options: [
            { label: 'Canceled', value: '4' },
            { label: 'Out-Sold', value: '5' },
          ],
      },
    }),
    actualRevenue: Property.Number({
      displayName: 'Actual Revenue',
      description: 'Optional. Usually empty for a lost deal.',
      required: false,
    }),
    closeDate: Property.DateTime({
      displayName: 'Actual Close Date',
      description: 'Defaults to today when empty.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: closeOpportunityOutputSchema,
  async run(context) {
    const { opportunityId, subject, statusReason, actualRevenue, closeDate, description } = context.propsValue;
    const id = odata.requireGuid({ value: opportunityId, label: 'Opportunity' });
    const status = salesEntities.statusReason({ value: statusReason, fallback: 4 });
    await makeClient(context.auth).closeOpportunity({
      opportunityId: id,
      outcome: 'lost',
      status,
      subject,
      actualRevenue: actualRevenue === undefined || actualRevenue === null ? undefined : salesEntities.readNumber({ value: actualRevenue, label: 'Actual Revenue' }),
      closeDate: closeDate ? salesEntities.readDate({ value: closeDate, label: 'Actual Close Date' }) : undefined,
      description,
    });
    return { success: true, opportunityId: id, outcome: 'lost', statusReason: status };
  },
});
