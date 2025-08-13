import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof xeroAuth>,
  { tenant_id: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const tenantId = propsValue.tenant_id;

    const fromDate = lastFetchEpochMS
      ? dayjs(lastFetchEpochMS).format('YYYY-MM-DD')
      : dayjs().subtract(7, 'days').format('YYYY-MM-DD');

    try {
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        `/PurchaseOrders?where=Date>=DateTime(${fromDate})&order=Date DESC`,
        null,
        {
          'Xero-Tenant-Id': tenantId,
        }
      );

      const purchaseOrders = response.PurchaseOrders || [];

      return purchaseOrders.map((purchaseOrder: any) => ({
        epochMilliSeconds: dayjs(
          purchaseOrder.DateString || purchaseOrder.Date
        ).valueOf(),
        data: purchaseOrder,
      }));
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  },
};

export const newPurchaseOrder = createTrigger({
  auth: xeroAuth,
  name: 'newPurchaseOrder',
  displayName: 'New Purchase Order',
  description: 'Fires when a new purchase order is created in Xero',
  props: {
    tenant_id: props.tenant_id,
  },
  sampleData: {
    PurchaseOrderID: '12345678-1234-1234-1234-123456789012',
    PurchaseOrderNumber: 'PO-001',
    Contact: {
      ContactID: '87654321-4321-4321-4321-210987654321',
      Name: 'ABC Supplier Ltd',
    },
    Date: '2025-08-13',
    DeliveryDate: '2025-08-20',
    Status: 'DRAFT',
    LineItems: [
      {
        Description: 'Office Supplies',
        Quantity: 10,
        UnitAmount: 25.0,
        LineAmount: 250.0,
        AccountCode: '400',
        TaxType: 'INPUT',
      },
    ],
    SubTotal: 250.0,
    TotalTax: 25.0,
    Total: 275.0,
    CurrencyCode: 'USD',
    Reference: 'Monthly office supplies order',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
