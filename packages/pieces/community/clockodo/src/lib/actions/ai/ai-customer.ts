import { Property, createAction } from '@activepieces/pieces-framework';
import { deletedResult, makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';
import { clockodoAiProps } from './ai-props';

const customerProps = {
  number: Property.ShortText({ displayName: 'Number', description: 'Your own customer number.', required: false }),
  active: clockodoAiProps.yesNo({ displayName: 'Active', description: 'Whether the customer is active.' }),
  billable: clockodoAiProps.yesNo({
    displayName: 'Billable by Default',
    description: 'Whether new entries for this customer are billable by default.',
  }),
  note: Property.LongText({ displayName: 'Note', placeholder: 'e.g. Agreed by phone', required: false }),
  color: clockodoAiProps.color(),
};

export const aiCreateCustomer = createAction({
  auth: clockodoAuth,
  name: 'ai_create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Creates a customer in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.customer,
  aiMetadata: {
    description:
      'Creates a Clockodo customer and returns it with its numeric id. Only name is required; active and billable take "yes"/"no", color takes a named color. Not idempotent: each call adds another customer, so check Get Customers first.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    ...customerProps,
  },
  async run({ auth, propsValue }) {
    return makeClient(auth.props).createCustomer(
      clockodoRequests.customerBody({
        name: clockodoRequests.requireValue({ value: propsValue.name.trim(), field: 'Name' }),
        number: clockodoRequests.optionalText(propsValue.number),
        active: clockodoRequests.parseYesNo({ value: propsValue.active, field: 'Active' }),
        billable_default: clockodoRequests.parseYesNo({ value: propsValue.billable, field: 'Billable by Default' }),
        note: clockodoRequests.optionalText(propsValue.note),
        color: clockodoAiProps.parseColor(propsValue.color),
      })
    );
  },
});

export const aiGetCustomer = createAction({
  auth: clockodoAuth,
  name: 'ai_get_customer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Retrieves a single customer from Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.customer,
  aiMetadata: {
    description:
      'Returns one Clockodo customer by its numeric customer id (find ids with Get Customers). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    customer_id: clockodoAiProps.id({ displayName: 'Customer ID', source: 'Get Customers', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer ID' });
    return makeClient(auth.props).getCustomer(id);
  },
});

export const aiUpdateCustomer = createAction({
  auth: clockodoAuth,
  name: 'ai_update_customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Updates a customer in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.customer,
  aiMetadata: {
    description:
      'Changes only the fields you give on a Clockodo customer identified by its numeric customer id; omitted fields are left as they are. Idempotent: the same values give the same result.',
    idempotent: true,
  },
  props: {
    customer_id: clockodoAiProps.id({ displayName: 'Customer ID', source: 'Get Customers', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    ...customerProps,
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer ID' });
    return makeClient(auth.props).updateCustomer({
      id,
      request: clockodoRequests.customerBody({
        name: propsValue.name || undefined,
        number: clockodoRequests.optionalText(propsValue.number),
        active: clockodoRequests.parseYesNo({ value: propsValue.active, field: 'Active' }),
        billable_default: clockodoRequests.parseYesNo({ value: propsValue.billable, field: 'Billable by Default' }),
        note: clockodoRequests.optionalText(propsValue.note),
        color: clockodoAiProps.parseColor(propsValue.color),
      }),
    });
  },
});

export const aiDeleteCustomer = createAction({
  auth: clockodoAuth,
  name: 'ai_delete_customer',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Customer',
  description: 'Deletes a customer in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Clockodo customer by its numeric customer id. Clockodo only deletes inactive customers: set active "no" with Update Customer first, otherwise it fails with "The resource must be inactive". Not idempotent: a second call for the same id fails because the customer is gone.',
    idempotent: false,
  },
  props: {
    customer_id: clockodoAiProps.id({ displayName: 'Customer ID', source: 'Get Customers', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer ID' });
    await makeClient(auth.props).deleteCustomer(id);
    return deletedResult(id);
  },
});
