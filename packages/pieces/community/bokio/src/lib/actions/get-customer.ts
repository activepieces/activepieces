import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';

export const getCustomer = createAction({
  auth: bokioAuth,
  name: 'get_customer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Retrieves a customer by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves one Bokio customer by its UUID (from Find Customer or an invoice customerRef.id), including contacts, address, VAT/org number and payment terms. Read-only.',
    idempotent: true,
  },
  outputSchema: bokioSchemas.customer,
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Customer UUID. Get it from Find Customer, Get Draft Invoice by Customer Name, or the output of Create Customer.',
      required: true,
    }),
  },
  async run(context) {
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/customers/${bokioBuilders.requireUuid({ value: context.propsValue.customerId, kind: 'customer' })}`,
      operation: 'get customer',
    });
  },
});
