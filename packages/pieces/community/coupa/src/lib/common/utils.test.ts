import { describe, expect, it } from 'vitest';
import {
  flattenRecord,
  formatCoupaError,
  formatCoupaOutput,
  getMimeType,
  normalizeInstanceUrl,
  parseJsonBody,
  toStandardCoupaFields,
} from './utils';

describe('normalizeInstanceUrl', () => {
  it('strips protocol and trailing slashes and trims', () => {
    expect(normalizeInstanceUrl('https://acme.coupahost.com')).toBe('acme.coupahost.com');
    expect(normalizeInstanceUrl('http://acme.coupahost.com/')).toBe('acme.coupahost.com');
    expect(normalizeInstanceUrl('  acme.coupahost.com//  ')).toBe('acme.coupahost.com');
  });

  it('is case-insensitive on the protocol but preserves host casing', () => {
    expect(normalizeInstanceUrl('HTTPS://Acme.CoupaHost.com')).toBe('Acme.CoupaHost.com');
  });
});

describe('flattenRecord', () => {
  it('flattens nested objects with underscore-joined keys', () => {
    expect(flattenRecord({ supplier: { id: 1, name: 'Acme' } })).toEqual({
      supplier_id: 1,
      supplier_name: 'Acme',
    });
  });

  it('converts kebab-case keys to snake_case', () => {
    expect(flattenRecord({ 'po-number': 'PO-1' })).toEqual({ po_number: 'PO-1' });
  });

  it('JSON-stringifies nested arrays under their key', () => {
    expect(flattenRecord({ lines: [{ id: 1 }, { id: 2 }] })).toEqual({
      lines: JSON.stringify([{ id: 1 }, { id: 2 }]),
    });
  });

  it('puts a top-level array under "items"', () => {
    expect(flattenRecord([1, 2])).toEqual({ items: JSON.stringify([1, 2]) });
  });

  it('preserves null leaf values', () => {
    expect(flattenRecord({ status: null })).toEqual({ status: null });
  });
});

describe('toStandardCoupaFields', () => {
  it('maps purchase order fields', () => {
    const record = {
      id: 10,
      'po-number': 'PO-1001',
      status: 'issued',
      total: '1500.0',
      supplier: { id: 99, name: 'Acme' },
    };
    expect(toStandardCoupaFields(record, 'purchase_orders')).toEqual({
      id: 10,
      supplier_id: 99,
      supplier_name: 'Acme',
      po_number: 'PO-1001',
      po_status: 'issued',
      total_amount: '1500.0',
      contract_id: null,
    });
  });

  it('falls back to "number" when po-number is absent', () => {
    const fields = toStandardCoupaFields(
      { id: 1, number: 'PO-2', status: 'draft' },
      'purchase_orders'
    );
    expect(fields.po_number).toBe('PO-2');
  });

  it('maps supplier fields from id/name', () => {
    const fields = toStandardCoupaFields(
      { id: 5, name: 'Globex', status: 'active' },
      'suppliers'
    );
    expect(fields.supplier_id).toBe(5);
    expect(fields.supplier_name).toBe('Globex');
    expect(fields.po_status).toBe('active');
  });

  it('maps contract fields and contract-amount fallback', () => {
    const fields = toStandardCoupaFields(
      { id: 7, status: 'published', 'contract-amount': '900' },
      'contracts'
    );
    expect(fields.contract_id).toBe(7);
    expect(fields.total_amount).toBe('900');
  });
});

describe('formatCoupaOutput', () => {
  it('merges flattened record with standardized fields (standard wins)', () => {
    const out = formatCoupaOutput(
      { id: 1, 'po-number': 'PO-1', status: 'issued', supplier: { id: 2, name: 'Acme' } },
      'purchase_orders'
    );
    expect(out['po_number']).toBe('PO-1');
    expect(out['supplier_id']).toBe(2);
    expect(out['supplier_name']).toBe('Acme');
    expect(out['po_status']).toBe('issued');
  });
});

describe('parseJsonBody', () => {
  it('returns {} for empty inputs', () => {
    expect(parseJsonBody('')).toEqual({});
    expect(parseJsonBody(null)).toEqual({});
    expect(parseJsonBody(undefined)).toEqual({});
  });

  it('passes objects through untouched', () => {
    const obj = { a: 1 };
    expect(parseJsonBody(obj)).toBe(obj);
  });

  it('parses JSON strings', () => {
    expect(parseJsonBody('{"a":1}')).toEqual({ a: 1 });
  });

  it('throws on invalid JSON strings', () => {
    expect(() => parseJsonBody('{not json}')).toThrow();
  });
});

describe('formatCoupaError', () => {
  it('formats a string error body with status', () => {
    expect(
      formatCoupaError({ response: { status: 404, body: 'Not Found' } })
    ).toBe('Coupa API error (404): Not Found');
  });

  it('JSON-stringifies an object error body', () => {
    expect(
      formatCoupaError({ response: { status: 422, body: { errors: ['bad'] } } })
    ).toBe('Coupa API error (422): {"errors":["bad"]}');
  });

  it('falls back to message when there is no response body', () => {
    expect(formatCoupaError({ message: 'socket hang up' })).toBe(
      'Coupa API error: socket hang up'
    );
  });
});

describe('getMimeType', () => {
  it('resolves by file extension', () => {
    expect(getMimeType('invoice.pdf')).toBe('application/pdf');
    expect(getMimeType('photo.JPG')).toBe('image/jpeg');
  });

  it('honors an explicit extension argument', () => {
    expect(getMimeType('file', 'csv')).toBe('text/csv');
    expect(getMimeType('file', '.png')).toBe('image/png');
  });

  it('falls back to octet-stream for unknown extensions', () => {
    expect(getMimeType('archive.unknownext')).toBe('application/octet-stream');
    expect(getMimeType('noextension')).toBe('application/octet-stream');
  });
});
