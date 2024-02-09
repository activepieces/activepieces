import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description: 'Updates a customer in clockodo',
  props: {
    customer_id: clockodoCommon.customer_id(true, undefined),
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
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
    color: clockodoCommon.color(false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.updateCustomer(propsValue.customer_id as number, {
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
