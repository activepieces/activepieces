import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a customer in clockodo',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
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
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
    color: clockodoCommon.color(false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.createCustomer({
      name: propsValue.name,
      number: emptyToNull(propsValue.number),
      active: propsValue.active,
      billable_default: propsValue.billable,
      note: emptyToNull(propsValue.note),
      color: propsValue.color,
    });
    return res.customer;
  },
});
