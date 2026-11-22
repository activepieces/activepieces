import { describe, expect, it } from 'vitest';
import { bokioBuilders } from '../src/lib/common/builders';
import { bokioClient } from '../src/lib/common/client';

describe('buildCustomerBody', () => {
  it('sends camelCase fields, a contacts array and a full address', () => {
    expect(
      bokioBuilders.buildCustomerBody({
        name: 'Acme AB',
        type: 'company',
        vatNumber: 'SE556677889901',
        orgNumber: '556677-8899',
        customerNumber: '42',
        paymentTerms: '30',
        language: 'en',
        email: 'a@b.se',
        line1: 'Gatan 1',
        postalCode: '11122',
        city: 'Stockholm',
        country: 'se',
      })
    ).toEqual({
      name: 'Acme AB',
      type: 'company',
      vatNumber: 'SE556677889901',
      orgNumber: '556677-8899',
      customerNumber: '42',
      paymentTerms: '30',
      language: 'en',
      contactsDetails: [{ name: 'Acme AB', email: 'a@b.se', isDefault: true }],
      address: { line1: 'Gatan 1', postalCode: '11122', city: 'Stockholm', country: 'SE' },
    });
  });

  it('rejects a partial address', () => {
    expect(() =>
      bokioBuilders.buildCustomerBody({ name: 'A', type: 'private', city: 'Lund' })
    ).toThrow(/address line 1, zip code, country/);
  });
});

describe('buildSalesLineItem', () => {
  it('keeps itemType and description on a description-only line', () => {
    expect(
      bokioBuilders.buildSalesLineItem({ itemType: 'descriptionOnlyItem', description: 'Note' })
    ).toEqual({ itemType: 'descriptionOnlyItem', description: 'Note' });
  });

  it('maps legacy service to services and puts description on the line', () => {
    expect(
      bokioBuilders.buildSalesLineItem({
        itemType: 'salesItem',
        description: 'Consulting',
        productType: 'service',
        unitType: 'hour',
        quantity: 2,
        unitPrice: '100',
        taxRate: 25,
      })
    ).toEqual({
      itemType: 'salesItem',
      description: 'Consulting',
      productType: 'services',
      unitType: 'hour',
      quantity: 2,
      unitPrice: 100,
      taxRate: 25,
    });
  });

  it('requires tax rate on a sales line without an item', () => {
    expect(() =>
      bokioBuilders.buildSalesLineItem({
        itemType: 'salesItem',
        description: 'X',
        productType: 'goods',
        quantity: 1,
        unitPrice: 1,
      })
    ).toThrow(/tax rate/);
  });

  it('accepts an itemRef line with only quantity and price', () => {
    expect(
      bokioBuilders.buildSalesLineItem({ itemType: 'salesItem', itemId: '33333333-3333-4333-8333-333333333333', quantity: 1, unitPrice: 5 })
    ).toEqual({ itemType: 'salesItem', quantity: 1, unitPrice: 5, itemRef: { id: '33333333-3333-4333-8333-333333333333' } });
  });
});

describe('buildInvoiceBody', () => {
  it('always sends type invoice and validates dates', () => {
    expect(
      bokioBuilders.buildInvoiceBody({
        invoiceDate: '2026-11-22',
        customerId: '22222222-2222-4222-8222-222222222222',
        currency: 'sek',
        lineItems: [{ itemType: 'descriptionOnlyItem', description: 'x' }],
      })
    ).toEqual({
      type: 'invoice',
      invoiceDate: '2026-11-22',
      customerRef: { id: '22222222-2222-4222-8222-222222222222' },
      currency: 'SEK',
      lineItems: [{ itemType: 'descriptionOnlyItem', description: 'x' }],
    });
    expect(() =>
      bokioBuilders.buildInvoiceBody({ invoiceDate: '2026-02-30', lineItems: [] })
    ).toThrow(/valid calendar date/);
    expect(() =>
      bokioBuilders.buildInvoiceBody({ invoiceDate: '22/11/2026', lineItems: [] })
    ).toThrow(/YYYY-MM-DD/);
  });
});

describe('buildItemBody', () => {
  it('maps legacy text to descriptionOnlyItem', () => {
    expect(bokioBuilders.buildItemBody({ itemType: 'text', description: 'Hi' })).toEqual({
      itemType: 'descriptionOnlyItem',
      description: 'Hi',
    });
  });

  it('requires unit type and tax rate for a sales item', () => {
    expect(() =>
      bokioBuilders.buildItemBody({ itemType: 'salesItem', description: 'A', productType: 'goods', unitPrice: 1 })
    ).toThrow(/unit type, tax rate/);
  });

  it('parses bookkeeping account number as an integer', () => {
    expect(
      bokioBuilders.buildItemBody({
        itemType: 'salesItem',
        description: 'A',
        productType: 'services',
        unitType: 'hour',
        unitPrice: 10,
        taxRate: 25,
        bookkeepingAccountNumber: '3001',
      })
    ).toMatchObject({ bookkeepingAccountNumber: 3001 });
    expect(() =>
      bokioBuilders.buildItemBody({
        itemType: 'salesItem',
        description: 'A',
        productType: 'services',
        unitType: 'hour',
        unitPrice: 10,
        taxRate: 25,
        bookkeepingAccountNumber: '30.5',
      })
    ).toThrow(/whole number/);
  });
});

describe('buildJournalBody', () => {
  it('builds a balanced entry from a JSON string', () => {
    expect(
      bokioBuilders.buildJournalBody({
        title: 'Sale',
        date: '2026-11-22',
        lines: '[{"account":1930,"debit":125.10},{"account":3001,"credit":"125.1"}]',
      })
    ).toEqual({
      title: 'Sale',
      date: '2026-11-22',
      items: [
        { account: 1930, debit: 125.1, credit: 0 },
        { account: 3001, debit: 0, credit: 125.1 },
      ],
    });
  });

  it('rejects unbalanced entries', () => {
    expect(() =>
      bokioBuilders.buildJournalBody({
        title: 'X',
        date: '2026-11-22',
        lines: [{ account: 1930, debit: 100 }, { account: 3001, credit: 90 }],
      })
    ).toThrow(/Debits \(100.00\) must equal credits \(90.00\)/);
  });

  it('names the bad line', () => {
    expect(() =>
      bokioBuilders.buildJournalBody({
        title: 'X',
        date: '2026-11-22',
        lines: [{ account: 1930, debit: 100 }, { debit: 0, credit: 100 }],
      })
    ).toThrow(/Line 2: account/);
    expect(() =>
      bokioBuilders.buildJournalBody({ title: 'X', date: '2026-11-22', lines: 'not json' })
    ).toThrow(/JSON array/);
    expect(() =>
      bokioBuilders.buildJournalBody({ title: '', date: '2026-11-22', lines: '[]' })
    ).toThrow(/Title/);
  });
});

describe('mergeInvoiceForUpdate', () => {
  const existing = {
    id: '11111111-1111-4111-8111-111111111111-1',
    status: 'draft',
    invoiceDate: '2026-11-01',
    dueDate: '2026-12-01',
    lineItems: [{ itemType: 'descriptionOnlyItem', description: 'keep' }],
  };

  it('keeps lines and untouched fields', () => {
    expect(
      bokioBuilders.mergeInvoiceForUpdate({ existing, changes: { dueDate: '2026-12-31', invoiceDate: '' } })
    ).toEqual({ ...existing, dueDate: '2026-12-31' });
  });

  it('refuses non-draft invoices', () => {
    expect(() =>
      bokioBuilders.mergeInvoiceForUpdate({ existing: { ...existing, status: 'published' }, changes: {} })
    ).toThrow(/Only draft/);
  });
});

describe('client helpers', () => {
  it('builds unquoted filters and blocks operator injection', () => {
    expect(
      bokioClient.buildFilter([
        { field: 'name', operator: '==', value: 'John Doe' },
        { field: 'type', operator: '==', value: undefined },
      ])
    ).toBe('name==John Doe');
    expect(() =>
      bokioClient.buildFilter([{ field: 'name', operator: '==', value: 'a||type==company' }])
    ).toThrow(/cannot contain/);
  });

  it('clamps page size', () => {
    expect(bokioClient.listParams({ page: 0, pageSize: 500 })).toEqual({ page: '1', pageSize: '100' });
    expect(bokioClient.listParams({ page: undefined, pageSize: 0 })).toEqual({ pageSize: '1' });
  });
});

describe('requireUuid', () => {
  it('accepts UUIDs and names the source on failure', () => {
    expect(bokioBuilders.requireUuid({ value: ' 33333333-3333-4333-8333-333333333333 ', kind: 'item' })).toBe(
      '33333333-3333-4333-8333-333333333333'
    );
    expect(() => bokioBuilders.requireUuid({ value: 'abc', kind: 'journalEntry' })).toThrow(
      'Journal entry ID must be a Bokio UUID (got "abc"). Get it from List Journal Entries.'
    );
    expect(bokioBuilders.optionalUuid({ value: '', kind: 'customer' })).toBeUndefined();
  });
});
