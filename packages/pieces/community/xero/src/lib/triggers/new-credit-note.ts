import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
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

    // Calculate the date filter for new credit notes
    const fromDate = lastFetchEpochMS
      ? dayjs(lastFetchEpochMS).format('YYYY-MM-DD')
      : dayjs().subtract(7, 'days').format('YYYY-MM-DD'); // Default to last 7 days

    try {
      // Fetch credit notes with date filter
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        `/CreditNotes?where=Date>=DateTime(${fromDate})&order=Date DESC`,
        null,
        {
          'Xero-Tenant-Id': tenantId,
        }
      );

      const creditNotes = response.CreditNotes || [];

      // Map credit notes to the required format
      return creditNotes.map((creditNote: any) => ({
        epochMilliSeconds: dayjs(creditNote.DateString || creditNote.Date).valueOf(),
        data: creditNote,
      }));
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      return [];
    }
  },
};

export const newCreditNote = createTrigger({
  auth: xeroAuth,
  name: 'newCreditNote',
  displayName: 'New Credit Note',
  description: 'Fires when a new credit note is created in Xero',
  props: {
    tenant_id: props.tenant_id,
  },
  sampleData: {
    CreditNoteID: '12345678-1234-1234-1234-123456789012',
    CreditNoteNumber: 'CN-001',
    Type: 'ACCRECCREDIT',
    Contact: {
      ContactID: '87654321-4321-4321-4321-210987654321',
      Name: 'ABC Customer Ltd',
    },
    Date: '2025-08-13',
    Status: 'AUTHORISED',
    LineItems: [
      {
        Description: 'Product Return Credit',
        Quantity: 2,
        UnitAmount: 75.00,
        LineAmount: 150.00,
        AccountCode: '200',
        TaxType: 'OUTPUT',
      },
    ],
    SubTotal: 150.00,
    TotalTax: 15.00,
    Total: 165.00,
    CurrencyCode: 'USD',
    Reference: 'Credit for returned items',
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