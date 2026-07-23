import { createAction, Property } from '@activepieces/pieces-framework';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';
import { netsuiteRecords } from '../common/records';

export const createBill = createAction({
  name: 'createBill',
  auth: netsuiteAuth,
  displayName: 'Create Bill',
  description: 'Creates a vendor bill in NetSuite.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a vendor bill in NetSuite. Requires the vendor internal id (entity) and at least one item line or expense line. Returns the new bill id. This is a write action and is NOT safe to repeat unless an External ID is set for idempotency.',
    idempotent: false,
  },
  props: {
    vendorId: Property.ShortText({
      displayName: 'Vendor ID',
      description: 'Internal id of the vendor (entity) being billed.',
      required: true,
    }),
    lineItems: netsuiteRecords.lineItemsProp,
    expenseLines: netsuiteRecords.expenseLinesProp,
    ...netsuiteRecords.transactionProps,
    additionalFields: netsuiteRecords.additionalFieldsProp,
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const { vendorId, lineItems, expenseLines, additionalFields, ...scalars } =
      context.propsValue;

    const body = netsuiteRecords.compact({
      entity: netsuiteRecords.toRef(vendorId),
      item: netsuiteRecords.buildLineItems(lineItems),
      expense: netsuiteRecords.buildExpenseLines(expenseLines),
      ...netsuiteRecords.buildTransactionScalars(scalars),
      ...(additionalFields ?? {}),
    });

    return client.createRecord({ recordType: 'vendorBill', body });
  },
});
