import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'update_project',
  displayName: 'Update Project',
  description: 'Updates a project in clockodo',
  props: {
    project_id: clockodoCommon.project_id(true, false, null),
    customer_id: clockodoCommon.customer_id(false),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      required: false,
    }),
    budget: Property.Number({
      displayName: 'Budget',
      required: false,
    }),
    budget_is_hours: Property.Checkbox({
      displayName: 'Budget in hours?',
      required: false,
    }),
    budget_is_not_strict: Property.Checkbox({
      displayName: 'Soft Budget',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed',
      required: false,
    }),
    billed_amount: Property.Number({
      displayName: 'Billed Amount',
      required: false,
    }),
    billing_complete: Property.Checkbox({
      displayName: 'Billing Complete',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.updateProject(propsValue.project_id as number, {
      name: propsValue.name,
      customers_id: propsValue.customer_id,
      number: emptyToNull(propsValue.number),
      active: propsValue.active,
      billable_default: propsValue.billable,
      note: emptyToNull(propsValue.note),
      budget_money: propsValue.budget,
      budget_is_hours: propsValue.budget_is_hours,
      budget_is_not_strict: propsValue.budget_is_not_strict,
      completed: propsValue.completed,
      billed_money: propsValue.billed_amount,
      billed_completely: propsValue.billing_complete,
    });
    return res.project;
  },
});
