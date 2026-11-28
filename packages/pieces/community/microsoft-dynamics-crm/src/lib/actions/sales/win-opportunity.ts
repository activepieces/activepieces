import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { closeOpportunityOutputSchema } from '../../common/output-schemas';
import { dynamicsProps } from '../../common/props';
import { salesEntities } from '../../common/sales-entities';

export const winOpportunityAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'win_opportunity',
  classification: 'WRITE',
  displayName: 'Win Opportunity',
  description: 'Closes an opportunity as won and records the actual revenue.',
  audience: 'human',
  aiMetadata: {
    description:
      'Closes an open Dynamics 365 opportunity as won. Not idempotent: a closed opportunity cannot be closed again.',
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
      defaultValue: 'Opportunity won',
    }),
    statusReason: Property.StaticDropdown<string>({
      displayName: 'Status Reason',
      description: 'Pick a reason, or map the option value of a custom status reason.',
      required: true,
      defaultValue: '3',
      options: {
        disabled: false,
        options: [{ label: 'Won', value: '3' }],
      },
    }),
    actualRevenue: Property.Number({
      displayName: 'Actual Revenue',
      description: 'Optional. The final deal value.',
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
    const status = salesEntities.statusReason({ value: statusReason, fallback: 3 });
    await makeClient(context.auth).closeOpportunity({
      opportunityId: id,
      outcome: 'won',
      status,
      subject,
      actualRevenue: actualRevenue === undefined || actualRevenue === null ? undefined : salesEntities.readNumber({ value: actualRevenue, label: 'Actual Revenue' }),
      closeDate: closeDate ? salesEntities.readDate({ value: closeDate, label: 'Actual Close Date' }) : undefined,
      description,
    });
    return { success: true, opportunityId: id, outcome: 'won', statusReason: status };
  },
});
