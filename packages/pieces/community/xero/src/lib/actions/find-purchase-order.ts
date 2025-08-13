import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const findPurchaseOrder = createAction({
  auth: xeroAuth,
  name: 'findPurchaseOrder',
  displayName: 'Find Purchase Order',
  description: 'Finds a purchase order by given parameters in Xero',
  props: {
    tenant_id:  props.tenant_id,
    purchaseOrderNumber: Property.ShortText({
      displayName: 'Purchase Order Number',
      description: 'The number of the purchase order to search for. Optional.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the purchase order to search for. Optional.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
          { label: 'Billed', value: 'BILLED' },
          { label: 'Deleted', value: 'DELETED' },
        ],
      },
    }),
    dateFrom: Property.ShortText({
      displayName: 'Date From',
      description: 'The start date to filter purchase orders (YYYY-MM-DD format). Optional.',
      required: false,
    }),
    dateTo: Property.ShortText({
      displayName: 'Date To',
      description: 'The end date to filter purchase orders (YYYY-MM-DD format). Optional.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { tenant_id, purchaseOrderNumber, status, dateFrom, dateTo } = propsValue;

    // Validate date formats if provided
    if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      throw new Error('Date From must be in YYYY-MM-DD format');
    }
    if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      throw new Error('Date To must be in YYYY-MM-DD format');
    }

    // Build the query parameters
    const queryParams = [];
    if (purchaseOrderNumber) {
      queryParams.push(`PurchaseOrderNumber="${encodeURIComponent(purchaseOrderNumber)}"`);
    }
    if (status) {
      queryParams.push(`Status="${encodeURIComponent(status)}"`);
    }
    if (dateFrom) {
      queryParams.push(`Date>=DateTime(${dateFrom})`);
    }
    if (dateTo) {
      queryParams.push(`Date<=DateTime(${dateTo})`);
    }
    const query = queryParams.join(' AND ');

    // Make the API request
    const response = await makeRequest(
      auth.access_token,
      HttpMethod.GET,
      `/PurchaseOrders?where=${query}`,
      null,
      {
        'Xero-Tenant-Id': tenant_id,
      }
    );

    // Return the response
    return {
      success: true,
      purchaseOrders: response.PurchaseOrders || [],
      message: response.PurchaseOrders?.length
        ? `${response.PurchaseOrders.length} purchase order(s) found.`
        : 'No purchase orders found.',
    };
  },
});