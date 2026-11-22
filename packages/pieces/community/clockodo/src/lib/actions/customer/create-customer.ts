import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient, normalizeColor } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Creates a customer in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.customer,
  aiMetadata: { description: 'Create a new Clockodo customer with a name and optional number, active flag, billable default, note, and color. Not idempotent: each call adds another customer even with identical input, so guard against duplicates. To edit an existing customer use Update Customer.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name as shown in Clockodo.',
      placeholder: 'e.g. Acme GmbH',
      required: true,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      description: 'Optional reference number of your own.',
      placeholder: 'e.g. C-1001',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Whether the record is active. Inactive records are hidden from time tracking.',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether new entries for this customer are billable by default.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional internal note.',
      placeholder: 'e.g. Agreed by phone',
      required: false,
    }),
    color: clockodoCommon.color(false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    return client.createCustomer(
      clockodoRequests.customerBody({
        name: propsValue.name,
        number: emptyToNull(propsValue.number),
        active: propsValue.active,
        billable_default: propsValue.billable,
        note: emptyToNull(propsValue.note),
        color: normalizeColor(propsValue.color),
      })
    );
  },
});
