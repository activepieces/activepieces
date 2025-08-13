import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const updatePurchaseOrder = createAction({
  auth: xeroAuth,
  name: 'updatePurchaseOrder',
  displayName: 'Update Purchase Order',
  description: 'Updates details of an existing purchase order in Xero',
  props: {
    tenant_id: props.tenant_id,
    purchaseOrderID: Property.ShortText({
      displayName: 'Purchase Order ID',
      description: 'The ID of the purchase order to update',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description:
        'The date of the purchase order (YYYY-MM-DD format). Optional.',
      required: false,
    }),
    deliveryDate: Property.ShortText({
      displayName: 'Delivery Date',
      description:
        'The delivery date of the purchase order (YYYY-MM-DD format). Optional.',
      required: false,
    }),
    lineItems: Property.Array({
      displayName: 'Line Items',
      description: 'The line items for the purchase order',
      required: false,
      properties: {
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description of the line item',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Quantity of the item',
          required: true,
        }),
        unitAmount: Property.Number({
          displayName: 'Unit Amount',
          description: 'Unit price of the item',
          required: true,
        }),
        accountCode: Property.ShortText({
          displayName: 'Account Code',
          description: 'The account code for the line item',
          required: false,
        }),
        taxType: Property.ShortText({
          displayName: 'Tax Type',
          description: 'The tax type for the line item',
          required: false,
        }),
      },
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Optional reference for the purchase order',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the purchase order',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
          { label: 'Deleted', value: 'DELETED' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    // Build the purchase order update data
    const purchaseOrderData: any = {
      ...(propsValue.date && { Date: propsValue.date }),
      ...(propsValue.deliveryDate && { DeliveryDate: propsValue.deliveryDate }),
      ...(propsValue.reference && { Reference: propsValue.reference }),
      ...(propsValue.status && { Status: propsValue.status }),
      ...(propsValue.lineItems && {
        LineItems: propsValue.lineItems.map((item: any) => ({
          Description: item.description,
          Quantity: item.quantity,
          UnitAmount: item.unitAmount,
          ...(item.accountCode && { AccountCode: item.accountCode }),
          ...(item.taxType && { TaxType: item.taxType }),
        })),
      }),
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      `/PurchaseOrders/${propsValue.purchaseOrderID}`,
      purchaseOrderData,
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );
    return response;
  },
});
