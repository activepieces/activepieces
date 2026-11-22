import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Creates a project in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.project,
  aiMetadata: { description: 'Create a new Clockodo project under a customer, with optional number, budget, billing defaults, and note. Not idempotent: each call adds another project even with identical input, so guard against duplicates. To change an existing project use Update Project.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name as shown in Clockodo.',
      placeholder: 'e.g. Website relaunch',
      required: true,
    }),
    customer_id: clockodoCommon.customer_id(),
    number: Property.ShortText({
      displayName: 'Number',
      description: 'Optional reference number of your own.',
      placeholder: 'e.g. P-2026-01',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Whether the record is active. Inactive records are hidden from time tracking.',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether new entries for this project are billable by default.',
      required: false,
    }),
    budget: Property.Number({
      displayName: 'Budget',
      description: 'Budget amount: money, or hours when "Budget in hours?" is ticked.',
      placeholder: 'e.g. 5000',
      required: false,
    }),
    budget_is_hours: Property.Checkbox({
      displayName: 'Budget in hours?',
      description: 'Tick if the budget is in hours instead of money (needs Budget).',
      required: false,
    }),
    budget_is_not_strict: Property.Checkbox({
      displayName: 'Soft Budget',
      description: 'Tick if the budget may be exceeded (needs Budget).',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional internal note.',
      placeholder: 'e.g. Agreed by phone',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const customers_id = clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer' });
    return makeClient(auth.props).createProject(
      clockodoRequests.projectCreateBody({
        name: propsValue.name,
        customers_id,
        number: emptyToNull(propsValue.number),
        active: propsValue.active,
        billable_default: propsValue.billable,
        note: emptyToNull(propsValue.note),
        budget_input: {
          amount: propsValue.budget,
          is_hours: propsValue.budget_is_hours || undefined,
          is_not_strict: propsValue.budget_is_not_strict || undefined,
        },
      })
    );
  },
});
