import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const createPurchaseOrder = createAction({
  auth: xeroAuth,
  name: 'createPurchaseOrder',
  displayName: 'Create Purchase Order',
  description: 'Creates a new purchase order for a contact in Xero',
  props: {
    tenant_id: props.tenant_id, // Tenant dropdown to select the organization
    contact_id: props.contact_id(true), // Contact ID is required
    date: Property.ShortText({
      displayName: 'Date',
      description:
        'The date of the purchase order (YYYY-MM-DD format). Defaults to today if not provided.',
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
      required: true,
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
      required: true,
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
    const purchaseOrderData: any = {
      Contact: {
        ContactID: propsValue.contact_id,
      },
      LineItems: propsValue.lineItems,
      Status: propsValue.status,
      ...(propsValue.date && { Date: propsValue.date }),
      ...(propsValue.deliveryDate && { DeliveryDate: propsValue.deliveryDate }),
      ...(propsValue.reference && { Reference: propsValue.reference }),
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.PUT,
      '/PurchaseOrders',
      { PurchaseOrders: [purchaseOrderData] },
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return response;
  },
});
