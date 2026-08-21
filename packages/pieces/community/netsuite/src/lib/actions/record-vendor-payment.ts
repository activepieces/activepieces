import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';
import { netsuiteRecords } from '../common/records';

interface VendorBillRecord {
  entity?: { id?: string };
  amountRemaining?: number;
  total?: number;
}

export const recordVendorPayment = createAction({
  name: 'recordVendorPayment',
  auth: netsuiteAuth,
  displayName: 'Record Vendor Payment',
  description: 'Pays an open vendor bill in NetSuite and records the vendor payment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Pays an open vendor bill in NetSuite. Fetches the bill first to confirm it belongs to the given vendor and to default the payment amount to the bill\'s remaining balance when no amount is given. Returns the new vendor payment id. This is a write action and is NOT safe to repeat unless an External ID is set for idempotency.',
    idempotent: false,
  },
  props: {
    vendorId: Property.ShortText({
      displayName: 'Vendor ID',
      description: 'Internal id of the vendor (entity) being paid.',
      required: true,
    }),
    vendorBillId: Property.ShortText({
      displayName: 'Vendor Bill ID',
      description: 'Internal id of the open bill to pay.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: "Amount to pay. Defaults to the bill's remaining balance if omitted.",
      required: false,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Internal id of the bank account to pay from. If omitted, NetSuite applies the account default.',
      required: false,
    }),
    ...netsuiteRecords.classificationFields,
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'Your own unique id for this payment; useful for idempotency.',
      required: false,
    }),
    additionalFields: netsuiteRecords.additionalFieldsProp,
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const { vendorId, vendorBillId, amount, accountId, externalId, additionalFields } =
      context.propsValue;

    // https://system.netsuite.com/help/helpcenter/en_US/APIs/REST_API_Browser/record/v1/2024.1/index.html#tag-vendorBill
    const bill = await client.makeRequest<VendorBillRecord>({
      method: HttpMethod.GET,
      url: `${client.baseUrl}/services/rest/record/v1/vendorBill/${vendorBillId}`,
    });

    if (bill.entity?.id !== undefined && String(bill.entity.id) !== String(vendorId)) {
      throw new Error(
        `Vendor bill ${vendorBillId} belongs to a different vendor than ${vendorId}.`
      );
    }

    const remaining = bill.amountRemaining ?? bill.total;
    const resolvedAmount = amount ?? remaining;
    if (resolvedAmount === undefined) {
      throw new Error(
        `Could not determine the remaining balance for vendor bill ${vendorBillId}; provide Amount explicitly.`
      );
    }
    if (amount !== undefined && remaining !== undefined && amount > remaining) {
      throw new Error(
        `Amount ${amount} exceeds vendor bill ${vendorBillId}'s remaining balance of ${remaining}.`
      );
    }

    const body = netsuiteRecords.compact({
      entity: netsuiteRecords.toRef(vendorId),
      account: netsuiteRecords.toRef(accountId),
      apply: {
        items: [
          netsuiteRecords.compact({
            apply: true,
            doc: netsuiteRecords.toRef(vendorBillId),
            amount: resolvedAmount,
            line: 0,
          }),
        ],
      },
      externalId,
      ...netsuiteRecords.buildClassificationRefs(context.propsValue),
      ...(additionalFields ?? {}),
    });

    // https://system.netsuite.com/help/helpcenter/en_US/APIs/REST_API_Browser/record/v1/2024.1/index.html#tag-vendorPayment
    return client.createRecord({ recordType: 'vendorPayment', body });
  },
});
