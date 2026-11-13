import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { xeroCreateInvoiceAi } from '../src/lib/actions/ai/create-invoice';
import { xeroCreatePaymentAi } from '../src/lib/actions/ai/create-payment';
import { xeroUpdateInvoiceAi } from '../src/lib/actions/ai/update-invoice';
import { xeroCreateInventoryItem } from '../src/lib/actions/create-inventory-item';
import { xeroCreateManualJournal } from '../src/lib/actions/create-manual-journal';
import { xeroGetProfitAndLoss } from '../src/lib/actions/get-profit-and-loss';
import { xeroGetAgedPayables } from '../src/lib/actions/get-aged-payables';
import { xeroSearchInvoices } from '../src/lib/actions/search-invoices';
import { xeroVoidInvoice } from '../src/lib/actions/void-invoice';
import { xeroDeletePayment } from '../src/lib/actions/delete-payment';
import { xeroAllocateCreditNoteToInvoice } from '../src/lib/actions/allocate-credit-note-to-invoice';
import { xeroAttachments } from '../src/lib/common/attachments';
import {
  requestedBody,
  requestedMethod,
  requestedRawBody,
  requestedUrl,
  runAction,
  stubFetch,
  stubFetchSequence,
} from './helpers';

const CONTACT_ID = '6d42f03b-181f-43e3-93fb-2025c012de92';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Create Invoice or Bill (AI)', () => {
  it('resolves the only organisation, sends unitdp=4 and keeps 4-decimal amounts exactly', async () => {
    const fetchMock = stubFetchSequence({
      responses: [
        { status: 200, body: [{ id: 'c1', tenantId: 'org-1', tenantType: 'ORGANISATION', tenantName: 'Demo' }] },
        { status: 200, body: { Invoices: [{ InvoiceID: 'inv-1', Status: 'DRAFT' }] } },
      ],
    });
    const result = await runAction({
      action: xeroCreateInvoiceAi,
      propsValue: {
        type: 'ACCREC',
        contact_id: CONTACT_ID,
        line_items: [{ Description: 'Widget', Quantity: '3', UnitAmount: '10.1234', AccountCode: '200' }],
        due_date: '2026-10-19',
        reference: 'AP-TEST-1',
      },
    });
    expect(requestedUrl({ fetchMock, call: 0 })).toBe('https://api.xero.com/connections');
    expect(requestedUrl({ fetchMock, call: 1 })).toBe('https://api.xero.com/api.xro/2.0/Invoices?unitdp=4');
    expect(requestedMethod({ fetchMock, call: 1 })).toBe('PUT');
    expect(String(requestedRawBody({ fetchMock, call: 1 }))).toContain('"UnitAmount":10.1234');
    expect(requestedBody({ fetchMock, call: 1 })).toEqual({
      Invoices: [
        {
          Type: 'ACCREC',
          Contact: { ContactID: CONTACT_ID },
          LineItems: [{ Description: 'Widget', Quantity: 3, UnitAmount: 10.1234, AccountCode: '200' }],
          Status: 'DRAFT',
          DueDate: '2026-10-19',
          Reference: 'AP-TEST-1',
        },
      ],
    });
    expect(result).toEqual({ InvoiceID: 'inv-1', Status: 'DRAFT' });
  });

  it('rejects bad line items before calling Xero', async () => {
    const fetchMock = stubFetch({ status: 200, body: {} });
    await expect(
      runAction({ action: xeroCreateInvoiceAi, propsValue: { tenant_id: 'org-1', type: 'ACCREC', contact_id: CONTACT_ID, line_items: [{ Description: 'x', Price: 5 }] } }),
    ).rejects.toThrow('unknown keys: Price');
    await expect(
      runAction({ action: xeroCreateInvoiceAi, propsValue: { tenant_id: 'org-1', type: 'ACCREC', contact_id: CONTACT_ID, line_items: [{ Description: 'x', UnitAmount: 1.23456 }] } }),
    ).rejects.toThrow('at most 4 decimal places');
    await expect(
      runAction({ action: xeroCreateInvoiceAi, propsValue: { tenant_id: 'org-1', type: 'ACCREC', contact_id: CONTACT_ID, line_items: [{ Quantity: 1 }] } }),
    ).rejects.toThrow('needs a Description or an ItemCode');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Update Invoice or Bill (AI)', () => {
  it('merges lines by LineItemID and appends new ones', async () => {
    const fetchMock = stubFetchSequence({
      responses: [
        { status: 200, body: { Invoices: [{ InvoiceID: 'inv-1', LineItems: [{ LineItemID: 'l1', Description: 'Old', Quantity: 1, UnitAmount: 5, LineAmount: 5 }] }] } },
        { status: 200, body: { Invoices: [{ InvoiceID: 'inv-1' }] } },
      ],
    });
    await runAction({
      action: xeroUpdateInvoiceAi,
      propsValue: {
        tenant_id: 'org-1',
        invoice_id: 'inv-1',
        merge_line_items: true,
        line_items: [{ LineItemID: 'l1', Quantity: 2 }, { Description: 'New', Quantity: 1, UnitAmount: 7 }],
      },
    });
    expect(requestedBody({ fetchMock, call: 1 })).toEqual({
      Invoices: [
        {
          LineItems: [
            { LineItemID: 'l1', Description: 'Old', Quantity: 2, UnitAmount: 5 },
            { Description: 'New', Quantity: 1, UnitAmount: 7 },
          ],
        },
      ],
    });
  });

  it('drops the saved totals when a merged line changes its price, and keeps them when it does not', async () => {
    const saved = { LineItemID: 'l1', Description: 'Old', Quantity: 1, UnitAmount: 5, LineAmount: 5, TaxType: 'OUTPUT', TaxAmount: 0.75 };
    const run = async ({ update }: { update: Record<string, unknown> }) => {
      const fetchMock = stubFetchSequence({
        responses: [
          { status: 200, body: { Invoices: [{ InvoiceID: 'inv-1', LineItems: [saved] }] } },
          { status: 200, body: { Invoices: [{ InvoiceID: 'inv-1' }] } },
        ],
      });
      await runAction({ action: xeroUpdateInvoiceAi, propsValue: { tenant_id: 'org-1', invoice_id: 'inv-1', merge_line_items: true, line_items: [{ LineItemID: 'l1', ...update }] } });
      const body = requestedBody({ fetchMock, call: 1 });
      return Reflect.get(Object(body), 'Invoices')[0].LineItems[0];
    };
    expect(await run({ update: { UnitAmount: 8 } })).toEqual({ LineItemID: 'l1', Description: 'Old', Quantity: 1, UnitAmount: 8, TaxType: 'OUTPUT' });
    expect(await run({ update: { DiscountRate: 10 } })).toEqual({ LineItemID: 'l1', Description: 'Old', Quantity: 1, UnitAmount: 5, TaxType: 'OUTPUT', DiscountRate: 10 });
    expect(await run({ update: { Quantity: 3, LineAmount: 15 } })).toEqual({ LineItemID: 'l1', Description: 'Old', Quantity: 3, UnitAmount: 5, LineAmount: 15, TaxType: 'OUTPUT' });
    expect(await run({ update: { TaxType: 'NONE' } })).toEqual({ LineItemID: 'l1', Description: 'Old', Quantity: 1, UnitAmount: 5, LineAmount: 5, TaxType: 'NONE' });
    expect(await run({ update: { Description: 'Renamed' } })).toEqual({ ...saved, Description: 'Renamed' });
  });

  it('refuses an update with nothing to change', async () => {
    stubFetch({ status: 200, body: {} });
    await expect(runAction({ action: xeroUpdateInvoiceAi, propsValue: { tenant_id: 'org-1', invoice_id: 'inv-1' } })).rejects.toThrow('Nothing to update');
  });
});

describe('Record Payment (AI)', () => {
  it('needs exactly one of account ID or code', async () => {
    const fetchMock = stubFetch({ status: 200, body: {} });
    await expect(
      runAction({ action: xeroCreatePaymentAi, propsValue: { tenant_id: 'org-1', invoice_id: 'inv-1', account_id: 'a', account_code: '090', amount: 5, date: '2026-10-05' } }),
    ).rejects.toThrow('exactly one of Account ID or Account Code');
    await expect(
      runAction({ action: xeroCreatePaymentAi, propsValue: { tenant_id: 'org-1', invoice_id: 'inv-1', account_code: '090', amount: 5.555, date: '2026-10-05' } }),
    ).rejects.toThrow('at most 2 decimal places');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Create Inventory Item account codes', () => {
  it('turns the selected account IDs into the account codes Xero reads', async () => {
    const fetchMock = stubFetchSequence({
      responses: [
        {
          status: 200,
          body: {
            Accounts: [
              { AccountID: 'acc-sales', Code: '200' },
              { AccountID: 'acc-cogs', Code: '310' },
              { AccountID: 'acc-inv', Code: '630' },
            ],
          },
        },
        { status: 200, body: { Items: [{ ItemID: 'i1', Code: 'AP-TEST-ITEM-1' }] } },
      ],
    });
    const result = await runAction({
      action: xeroCreateInventoryItem,
      propsValue: {
        tenant_id: 'org-1',
        code: 'AP-TEST-ITEM-1',
        sales_details: { UnitPrice: 10 },
        purchase_details: { UnitPrice: 4 },
        sales_account_id: 'acc-sales',
        cogs_account_id: 'acc-cogs',
        inventory_asset_account_id: 'acc-inv',
      },
    });
    expect(requestedUrl({ fetchMock, call: 0 })).toBe('https://api.xero.com/api.xro/2.0/Accounts');
    expect(requestedBody({ fetchMock, call: 1 })).toEqual({
      Code: 'AP-TEST-ITEM-1',
      SalesDetails: { UnitPrice: 10, AccountCode: '200' },
      PurchaseDetails: { UnitPrice: 4, COGSAccountCode: '310' },
      InventoryAssetAccountCode: '630',
      IsTrackedAsInventory: true,
    });
    expect(JSON.stringify(requestedBody({ fetchMock, call: 1 }))).not.toContain('AccountID');
    expect(result).toEqual({ Items: [{ ItemID: 'i1', Code: 'AP-TEST-ITEM-1' }] });
  });

  it('fails clearly when a selected account has no code', async () => {
    stubFetchSequence({ responses: [{ status: 200, body: { Accounts: [{ AccountID: 'acc-x' }] } }] });
    await expect(
      runAction({ action: xeroCreateInventoryItem, propsValue: { tenant_id: 'org-1', code: 'X', sales_account_id: 'acc-x' } }),
    ).rejects.toThrow('has no account code');
  });

  it('makes no extra call when no account is selected', async () => {
    const fetchMock = stubFetch({ status: 200, body: { Items: [] } });
    await runAction({ action: xeroCreateInventoryItem, propsValue: { tenant_id: 'org-1', code: 'X' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('Search Invoices', () => {
  it('builds the query and reports another page when the page is full', async () => {
    const fetchMock = stubFetch({ status: 200, body: { Invoices: [{ InvoiceID: 'a' }, { InvoiceID: 'b' }] } });
    const result = await runAction({
      action: xeroSearchInvoices,
      propsValue: { tenant_id: 'org-1', type: 'ACCREC', statuses: ['AUTHORISED'], date_from: '2026-01-01', page: 1, page_size: 2, summary_only: true },
    });
    const url = new URL(requestedUrl({ fetchMock }));
    expect(url.searchParams.get('where')).toBe('Type=="ACCREC" AND Date>=DateTime(2026, 1, 1)');
    expect(url.searchParams.get('Statuses')).toBe('AUTHORISED');
    expect(url.searchParams.get('pageSize')).toBe('2');
    expect(result).toEqual({ items: [{ InvoiceID: 'a' }, { InvoiceID: 'b' }], page: 1, pageSize: 2, hasMore: true });
  });

  it('refuses page sizes above 100', async () => {
    stubFetch({ status: 200, body: {} });
    await expect(runAction({ action: xeroSearchInvoices, propsValue: { tenant_id: 'org-1', page_size: 500 } })).rejects.toThrow('1 to 100');
  });
});

describe('Void or Delete Invoice', () => {
  it('deletes drafts, voids authorised invoices and leaves voided ones alone', async () => {
    const draft = stubFetchSequence({ responses: [{ status: 200, body: { Invoices: [{ InvoiceID: 'i1', Status: 'DRAFT' }] } }, { status: 200, body: { Invoices: [{ InvoiceID: 'i1', Status: 'DELETED' }] } }] });
    await runAction({ action: xeroVoidInvoice, propsValue: { tenant_id: 'org-1', invoice_id: 'i1' } });
    expect(requestedBody({ fetchMock: draft, call: 1 })).toEqual({ Invoices: [{ InvoiceID: 'i1', Status: 'DELETED' }] });

    const authorised = stubFetchSequence({ responses: [{ status: 200, body: { Invoices: [{ InvoiceID: 'i2', Status: 'AUTHORISED', AmountPaid: 0 }] } }, { status: 200, body: { Invoices: [{ InvoiceID: 'i2', Status: 'VOIDED' }] } }] });
    await runAction({ action: xeroVoidInvoice, propsValue: { tenant_id: 'org-1', invoice_id: 'i2' } });
    expect(requestedBody({ fetchMock: authorised, call: 1 })).toEqual({ Invoices: [{ InvoiceID: 'i2', Status: 'VOIDED' }] });

    const voided = stubFetch({ status: 200, body: { Invoices: [{ InvoiceID: 'i3', Status: 'VOIDED' }] } });
    await expect(runAction({ action: xeroVoidInvoice, propsValue: { tenant_id: 'org-1', invoice_id: 'i3' } })).resolves.toEqual({ InvoiceID: 'i3', Status: 'VOIDED' });
    expect(voided).toHaveBeenCalledTimes(1);
  });

  it('refuses paid invoices', async () => {
    stubFetch({ status: 200, body: { Invoices: [{ InvoiceID: 'i4', Status: 'PAID', AmountPaid: 10 }] } });
    await expect(runAction({ action: xeroVoidInvoice, propsValue: { tenant_id: 'org-1', invoice_id: 'i4' } })).rejects.toThrow('Delete the payments');
  });
});

describe('Create Manual Journal', () => {
  it('refuses unbalanced journals before calling Xero', async () => {
    const fetchMock = stubFetch({ status: 200, body: {} });
    await expect(
      runAction({
        action: xeroCreateManualJournal,
        propsValue: { tenant_id: 'org-1', narration: 'AP-TEST', journal_lines: [{ LineAmount: 10, AccountCode: '400' }, { LineAmount: -9, AccountCode: '800' }] },
      }),
    ).rejects.toThrow('must balance');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Reports', () => {
  it('flattens Xero report rows into section, label and values', async () => {
    stubFetch({
      status: 200,
      body: {
        Reports: [
          {
            ReportID: 'ProfitAndLoss',
            ReportName: 'Profit and Loss',
            ReportType: 'ProfitAndLoss',
            ReportTitles: ['Profit & Loss', 'Demo'],
            ReportDate: '5 October 2026',
            Rows: [
              { RowType: 'Header', Cells: [{ Value: '' }, { Value: '31 Oct 26' }] },
              {
                RowType: 'Section',
                Title: 'Income',
                Rows: [{ RowType: 'Row', Cells: [{ Value: 'Sales', Attributes: [{ Id: 'account', Value: 'acc-1' }] }, { Value: '1200.50' }] }],
              },
            ],
          },
        ],
      },
    });
    const result = await runAction({ action: xeroGetProfitAndLoss, propsValue: { tenant_id: 'org-1', from_date: '2026-10-01', to_date: '2026-10-31' } });
    expect(result).toEqual({
      reportId: 'ProfitAndLoss',
      reportName: 'Profit and Loss',
      reportType: 'ProfitAndLoss',
      reportDate: '5 October 2026',
      reportTitles: ['Profit & Loss', 'Demo'],
      columns: ['', '31 Oct 26'],
      rows: [{ section: 'Income', rowType: 'Row', label: 'Sales', values: ['1200.50'], accountId: 'acc-1', invoiceId: null }],
    });
  });

  it('filters an aged report with Xero\'s contactId parameter and keeps each row\'s invoice ID', async () => {
    const fetchMock = stubFetch({
      status: 200,
      body: {
        Reports: [
          {
            ReportID: 'AgedPayablesByContact',
            ReportName: 'Aged Payables By Contact',
            ReportType: 'AgedPayablesByContact',
            Rows: [
              { RowType: 'Header', Cells: [{ Value: 'Date' }, { Value: 'Total' }] },
              {
                RowType: 'Section',
                Rows: [
                  {
                    RowType: 'Row',
                    Cells: [
                      { Value: '2026-09-01T00:00:00', Attributes: [{ Id: 'invoiceID', Value: 'inv-9' }] },
                      { Value: '250.00', Attributes: [{ Id: 'invoiceID', Value: 'inv-9' }] },
                    ],
                  },
                  { RowType: 'SummaryRow', Cells: [{ Value: 'Total' }, { Value: '250.00' }] },
                ],
              },
            ],
          },
        ],
      },
    });
    const result = await runAction({ action: xeroGetAgedPayables, propsValue: { tenant_id: 'org-1', contact_id: CONTACT_ID } });
    expect(new URL(requestedUrl({ fetchMock })).searchParams.get('contactId')).toBe(CONTACT_ID);
    expect((result as { rows: unknown[] }).rows).toEqual([
      { section: '', rowType: 'Row', label: '2026-09-01T00:00:00', values: ['250.00'], accountId: null, invoiceId: 'inv-9' },
      { section: '', rowType: 'SummaryRow', label: 'Total', values: ['250.00'], accountId: null, invoiceId: null },
    ]);
  });

  it('refuses more than 11 comparison periods', async () => {
    stubFetch({ status: 200, body: {} });
    await expect(runAction({ action: xeroGetProfitAndLoss, propsValue: { tenant_id: 'org-1', periods: 12 } })).rejects.toThrow('1 to 11');
  });
});

describe('Attachment MIME types', () => {
  it('maps common extensions instead of application/<ext>', () => {
    expect(xeroAttachments.mimeTypeFor({ fileName: 'scan.PNG' })).toBe('image/png');
    expect(xeroAttachments.mimeTypeFor({ fileName: 'photo', extension: 'jpg' })).toBe('image/jpeg');
    expect(xeroAttachments.mimeTypeFor({ fileName: 'sheet.xlsx' })).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(xeroAttachments.mimeTypeFor({ fileName: 'unknown.bin' })).toBe('application/octet-stream');
  });
});

describe('fixes found in the live run', () => {
  it('Void sends unitdp=4 so invoices with 4-decimal prices pass Xero validation', async () => {
    const fetchMock = stubFetchSequence({ responses: [{ status: 200, body: { Invoices: [{ InvoiceID: 'i2', Status: 'AUTHORISED', AmountPaid: 0 }] } }, { status: 200, body: { Invoices: [{ InvoiceID: 'i2', Status: 'VOIDED' }] } }] });
    await runAction({ action: xeroVoidInvoice, propsValue: { tenant_id: 'org-1', invoice_id: 'i2' } });
    expect(requestedUrl({ fetchMock, call: 0 })).toBe('https://api.xero.com/api.xro/2.0/Invoices/i2?unitdp=4');
    expect(requestedUrl({ fetchMock, call: 1 })).toBe('https://api.xero.com/api.xro/2.0/Invoices/i2?unitdp=4');
  });

  it('Delete Payment returns an already deleted payment without a second delete', async () => {
    const fetchMock = stubFetch({ status: 200, body: { Payments: [{ PaymentID: 'p1', Status: 'DELETED' }] } });
    await expect(runAction({ action: xeroDeletePayment, propsValue: { tenant_id: 'org-1', payment_id: 'p1' } })).resolves.toEqual({ PaymentID: 'p1', Status: 'DELETED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedMethod({ fetchMock })).toBe('GET');
  });

  it('Allocate Credit Note uses PUT, which Xero requires for allocations', async () => {
    const fetchMock = stubFetch({ status: 200, body: { Allocations: [{ AllocationID: 'a1' }] } });
    await runAction({ action: xeroAllocateCreditNoteToInvoice, propsValue: { tenant_id: 'org-1', credit_note_id: 'cn-1', invoice_id: 'inv-1', amount: 4 } });
    expect(requestedMethod({ fetchMock })).toBe('PUT');
    expect(requestedUrl({ fetchMock })).toBe('https://api.xero.com/api.xro/2.0/CreditNotes/cn-1/Allocations');
  });
});
