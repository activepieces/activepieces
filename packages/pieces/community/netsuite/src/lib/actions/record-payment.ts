import { createAction, Property } from '@activepieces/pieces-framework';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';
import { netsuiteRecords } from '../common/records';

export const recordPayment = createAction({
  name: 'recordPayment',
  auth: netsuiteAuth,
  displayName: 'Record Payment',
  description: 'Records a customer payment in NetSuite and applies it to invoices.',
  audience: 'both',
  aiMetadata: {
    description:
      'Records a customer payment (money received) in NetSuite and optionally applies it against one or more open invoices. Requires the customer internal id and the payment amount. Returns the new payment id. This is a write action and is NOT safe to repeat unless an External ID is set for idempotency.',
    idempotent: false,
  },
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Internal id of the customer who paid.',
      required: true,
    }),
    payment: Property.Number({
      displayName: 'Payment Amount',
      description: 'Total amount received from the customer.',
      required: true,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'Internal id of the bank/undeposited-funds account to post to.',
      required: false,
    }),
    applications: netsuiteRecords.paymentApplicationsProp,
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'Your own unique id for this payment; useful for idempotency.',
      required: false,
    }),
    additionalFields: netsuiteRecords.additionalFieldsProp,
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const { customerId, payment, accountId, applications, externalId, additionalFields } =
      context.propsValue;

    const body = netsuiteRecords.compact({
      customer: netsuiteRecords.toRef(customerId),
      payment,
      account: netsuiteRecords.toRef(accountId),
      apply: netsuiteRecords.buildPaymentApplications(applications),
      externalId,
      ...(additionalFields ?? {}),
    });

    return client.createRecord({ recordType: 'customerPayment', body });
  },
});
