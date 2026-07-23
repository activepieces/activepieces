import { createAction, Property } from '@activepieces/pieces-framework';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';
import { netsuiteRecords } from '../common/records';

export const createInvoice = createAction({
  name: 'createInvoice',
  auth: netsuiteAuth,
  displayName: 'Create Invoice',
  description: 'Creates a customer invoice in NetSuite.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a customer invoice in NetSuite. Requires the customer internal id (entity) and one or more item line items. Returns the new invoice id. This is a write action and is NOT safe to repeat unless an External ID is set for idempotency.',
    idempotent: false,
  },
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Internal id of the customer (entity) to bill.',
      required: true,
    }),
    lineItems: netsuiteRecords.lineItemsProp,
    ...netsuiteRecords.transactionProps,
    additionalFields: netsuiteRecords.additionalFieldsProp,
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const { customerId, lineItems, additionalFields, ...scalars } =
      context.propsValue;

    const body = netsuiteRecords.compact({
      entity: netsuiteRecords.toRef(customerId),
      item: netsuiteRecords.buildLineItems(lineItems),
      ...netsuiteRecords.buildTransactionScalars(scalars),
      ...(additionalFields ?? {}),
    });

    return client.createRecord({ recordType: 'invoice', body });
  },
});
