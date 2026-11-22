import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Updates a project in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.project,
  aiMetadata: { description: 'Update an existing Clockodo project identified by its numeric project ID, changing only the fields you supply (name, customer, budget, billing default, completed, note); marking completed needs at least one billable entry; billing complete marks all entries of the project as billed or not billed; billed amount is not used. Idempotent: re-sending the same values leaves the project unchanged. Requires a project ID; use Create Project to add a new one.', idempotent: true },
  props: {
    project_id: clockodoCommon.project_id(true, false, null),
    customer_id: clockodoCommon.customer_id(false),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name as shown in Clockodo.',
      placeholder: 'e.g. Website relaunch',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      description: 'Optional reference number of your own.',
      placeholder: 'e.g. P-2026-01',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Tick to set to yes. Leaving it unticked changes nothing — use Active Status to set no.',
      required: false,
    }),
    active_status: clockodoCommon.keepYesNo({
      displayName: 'Active Status',
      description: 'Set to Yes or No. Keep or empty leaves it unchanged; overrides the checkbox above.',
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Tick to set to yes. Leaving it unticked changes nothing — use Billable Status to set no.',
      required: false,
    }),
    billable_status: clockodoCommon.keepYesNo({
      displayName: 'Billable Status',
      description: 'Set to Yes or No. Keep or empty leaves it unchanged; overrides the checkbox above.',
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
    completed: Property.Checkbox({
      displayName: 'Completed',
      description: 'Tick to mark the project completed (Clockodo needs at least one billable entry on it). Leaving it unticked does not reopen a completed project.',
      required: false,
    }),
    billed_amount: Property.Number({
      displayName: 'Billed Amount',
      description: 'Not used: Clockodo no longer has a billed amount (use Billing Complete). Kept so older flows keep working.',
      required: false,
    }),
    billing_complete: Property.Checkbox({
      displayName: 'Billing Complete',
      description: 'Marks all entries of this project as billed (Yes) or not billed (No). Tick for Yes; leaving it unticked changes nothing — use Billing Complete Status for No.',
      required: false,
    }),
    billing_complete_status: clockodoCommon.keepYesNo({
      displayName: 'Billing Complete Status',
      description: 'Marks all entries of this project as billed (Yes) or not billed (No). Keep or empty leaves them unchanged; overrides the checkbox above.',
    }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.project_id, field: 'Project' });
    const client = makeClient(auth.props);
    const budget_input = {
      amount: propsValue.budget,
      is_hours: propsValue.budget_is_hours || undefined,
      is_not_strict: propsValue.budget_is_not_strict || undefined,
    };
    const stored_budget = clockodoRequests.needsStoredBudget(budget_input) ? (await client.getProject(id)).budget : undefined;
    return client.updateProjectAndCompletion({
      id,
      request: clockodoRequests.projectUpdateBody({
        name: propsValue.name || undefined,
        customers_id: clockodoRequests.parseOptionalId({ value: propsValue.customer_id, field: 'Customer' }),
        number: emptyToNull(propsValue.number),
        active: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.active, status: propsValue.active_status, field: 'Active Status' }),
        billable_default: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.billable, status: propsValue.billable_status, field: 'Billable Status' }),
        note: emptyToNull(propsValue.note),
        budget_input,
        stored_budget,
      }),
      completed: propsValue.completed ? true : undefined,
      billing: clockodoRequests.projectBilling({
        billed: clockodoRequests.checkboxOrStatus({
          checkbox: propsValue.billing_complete,
          status: propsValue.billing_complete_status,
          field: 'Billing Complete Status',
        }),
      }),
    });
  },
});
