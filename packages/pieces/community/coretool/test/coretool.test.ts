import { httpClient, HttpError } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { coretool } from '../src/index';
import { coretoolClient } from '../src/lib/common/client';

const auth = { type: 'SECRET_TEXT', secret_text: 'ct_test_dummy' };

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function action(name: string) {
  const found = coretool.actions()[name];
  if (!found) throw new Error(`missing action ${name}`);
  return found;
}

const baseProps = {
  format: 'zugferd',
  invoiceNumber: 'RE-2026-001',
  invoiceDate: '2026-10-22T00:00:00.000Z',
  sellerName: 'Example Ltd.',
  sellerStreet: 'Main Street 1',
  sellerZip: '22844',
  sellerCity: 'Norderstedt',
  sellerTaxNumber: '11/111/11111',
  buyerName: 'Customer GmbH',
  buyerStreet: 'Side Street 2',
  buyerZip: '20095',
  buyerCity: 'Hamburg',
  items: [{ description: 'Consulting services', quantity: 1, unit_price: 100, vat_rate: 19 }],
};

describe('coretool piece', () => {
  afterEach(() => vi.restoreAllMocks());

  it('registers the four actions plus custom API call', () => {
    expect(Object.keys(coretool.actions()).sort()).toEqual(
      ['check_leitweg_id', 'create_e_invoice', 'custom_api_call', 'get_usage', 'validate_e_invoice'].sort(),
    );
  });

  it('never targets craftsmen only in its description', () => {
    expect(coretool.description.toLowerCase()).not.toMatch(/craftsm|handwerk|trades/);
  });

  it('create_e_invoice sends a cleaned body and writes the file', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(ok({ content_base64: Buffer.from('%PDF-1.7').toString('base64'), filename: 'RE 2026/001.pdf', format: 'zugferd' }));
    const write = vi.fn().mockResolvedValue('file://RE_2026_001.pdf');
    const result = await Reflect.apply(action('create_e_invoice').run, undefined, [
      { auth, propsValue: { ...baseProps, currency: '', notes: '' }, files: { write } },
    ]);
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://api.coretool.de/v1/create');
    expect(request.headers?.['X-API-Key']).toBe('ct_test_dummy');
    const body = request.body as Record<string, unknown>;
    expect(body['invoice_date']).toBe('2026-10-22');
    expect(body['currency']).toBe('EUR');
    expect(body).not.toHaveProperty('notes');
    expect(body).not.toHaveProperty('payment');
    expect((body['seller'] as Record<string, unknown>)['country']).toBe('DE');
    expect(write).toHaveBeenCalledWith({ fileName: '001.pdf', data: Buffer.from('%PDF-1.7') });
    expect(result).toMatchObject({ format: 'zugferd', file: 'file://RE_2026_001.pdf' });
    expect(result).not.toHaveProperty('content_base64');
  });

  it('create_e_invoice requires tax number or VAT ID', async () => {
    const props = { ...baseProps, sellerTaxNumber: undefined };
    await expect(
      Reflect.apply(action('create_e_invoice').run, undefined, [{ auth, propsValue: props, files: { write: vi.fn() } }]),
    ).rejects.toThrow('Seller Tax Number or Seller VAT ID is required');
  });

  it('create_e_invoice rejects buyer reference together with Leitweg-ID', async () => {
    const props = { ...baseProps, buyerReference: 'X', leitwegId: '991-12345-67' };
    await expect(
      Reflect.apply(action('create_e_invoice').run, undefined, [{ auth, propsValue: props, files: { write: vi.fn() } }]),
    ).rejects.toThrow('not both');
  });

  it('validate_e_invoice uploads multipart with report flag', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(ok({ valid: true }));
    const result = await Reflect.apply(action('validate_e_invoice').run, undefined, [
      { auth, propsValue: { file: { data: Buffer.from('<xml/>'), filename: 'a.xml', extension: 'xml' }, report: true } },
    ]);
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://api.coretool.de/v1/validate');
    expect(request.body).toBeInstanceOf(FormData);
    expect(request.queryParams).toEqual({ report: 'true' });
    expect(result).toEqual({ valid: true });
  });

  it('validate_e_invoice rejects empty files', async () => {
    await expect(
      Reflect.apply(action('validate_e_invoice').run, undefined, [
        { auth, propsValue: { file: { data: Buffer.alloc(0), filename: 'a.xml', extension: 'xml' } } },
      ]),
    ).rejects.toThrow('empty');
  });

  it('check_leitweg_id maps gueltig to valid', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(ok({ gueltig: true, leitweg_id: '04011000-1234512345-06' }));
    const result = await Reflect.apply(action('check_leitweg_id').run, undefined, [
      { auth, propsValue: { leitwegId: ' 04011000-1234512345-06 ' } },
    ]);
    expect(result).toMatchObject({ valid: true, leitweg_id: '04011000-1234512345-06' });
  });

  it('get_usage flattens usage', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(
      ok({ key_id: 'k1', usage: { used: 3, limit: 50 }, pricing: 'https://coretool.de' }),
    );
    const result = await Reflect.apply(action('get_usage').run, undefined, [{ auth, propsValue: {} }]);
    expect(result).toEqual({ key_id: 'k1', used: 3, limit: 50, pricing: 'https://coretool.de' });
  });

  it('turns API errors into readable messages', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(
      new HttpError({}, { status: 422, responseBody: { error: 'invalid', message_en: 'Seller name missing' } }),
    );
    await expect(
      Reflect.apply(action('get_usage').run, undefined, [{ auth, propsValue: {} }]),
    ).rejects.toThrow('Seller name missing');
  });

  it('dateOnly rejects malformed dates', () => {
    expect(() => coretoolClient.dateOnly({ value: '22.10.2026', label: 'Invoice Date' })).toThrow('YYYY-MM-DD');
  });
});
