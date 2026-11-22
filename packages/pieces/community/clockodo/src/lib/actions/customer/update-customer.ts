import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient, normalizeColor } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'update_customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Updates a customer in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.customer,
  aiMetadata: { description: 'Update an existing Clockodo customer identified by their numeric customer ID, changing only the fields you supply (name, number, active flag, billable default, note, color). Idempotent: re-sending the same values leaves the customer unchanged. Requires a customer ID; use Create Customer to add a new one.', idempotent: true },
  props: {
    customer_id: clockodoCommon.customer_id(true, undefined),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name as shown in Clockodo.',
      placeholder: 'e.g. Acme GmbH',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      description: 'Optional reference number of your own.',
      placeholder: 'e.g. C-1001',
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
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional internal note.',
      placeholder: 'e.g. Agreed by phone',
      required: false,
    }),
    color: clockodoCommon.color(false),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer' });
    return makeClient(auth.props).updateCustomer({
      id,
      request: clockodoRequests.customerBody({
        name: propsValue.name || undefined,
        number: emptyToNull(propsValue.number),
        active: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.active, status: propsValue.active_status, field: 'Active Status' }),
        billable_default: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.billable, status: propsValue.billable_status, field: 'Billable Status' }),
        note: emptyToNull(propsValue.note),
        color: normalizeColor(propsValue.color),
      }),
    });
  },
});
