import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a project in clockodo',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    customer_id: clockodoCommon.customer_id(),
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
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.createProject({
      name: propsValue.name,
      customers_id: propsValue.customer_id as number,
      number: emptyToNull(propsValue.number),
      active: propsValue.active,
      billable_default: propsValue.billable,
      note: emptyToNull(propsValue.note),
      budget_money: propsValue.budget,
      budget_is_hours: propsValue.budget_is_hours,
      budget_is_not_strict: propsValue.budget_is_not_strict,
    });
    return res.project;
  },
});
