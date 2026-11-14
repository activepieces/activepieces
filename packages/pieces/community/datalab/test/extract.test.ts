import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatalabTiming } from '../src/lib/common/client';
import { extractOperation } from '../src/lib/operations/extract';

function fakeTiming(): DatalabTiming {
  let clock = 0;
  return {
    sleep: async (ms) => {
      clock += ms;
    },
    now: () => clock,
  };
}

function ok(body: unknown) {
  return { status: 200, body };
}

function formOf(body: unknown): Record<string, unknown> {
  if (!(body instanceof FormData)) {
    throw new Error('expected a FormData body');
  }
  return Object.fromEntries(body.entries());
}

const submitted = ok({ success: true, error: null, request_id: 'req_x', request_check_url: 'https://www.datalab.to/api/v1/extract/req_x' });
const processing = ok({ status: 'processing', progress_percent: 5, success: null, error: null, result_url: null });
const invoiceSchema = { type: 'object', properties: { invoice_number: { type: 'string' }, total_due: { type: 'number' } } };

const balancedExtraction = {
  invoice_number: 'INV-2026-0042',
  invoice_number_citations: ['/page/0/Text/1'],
  invoice_number_meta: {
    extraction_status: 'EXTRACTED',
    reasoning: null,
    citations: ['/page/0/Text/1'],
    verification: { status: 'PASS', feedback: 'Supported by /page/0/Text/1.' },
  },
  vendor: {
    name: 'Northwind Paper Supplies Ltd',
    name_citations: ['/page/0/Text/5'],
    name_meta: { extraction_status: 'EXTRACTED', reasoning: null, citations: ['/page/0/Text/5'], verification: { status: 'PASS', feedback: 'ok' } },
  },
  purchase_order_number: null,
  purchase_order_number_citations: [],
  purchase_order_number_meta: {
    extraction_status: 'NOT_RESOLVABLE',
    reasoning: null,
    citations: [],
    verification: { status: 'FAIL_UNRESOLVABLE', feedback: 'The document does not contain a purchase order number.' },
  },
  line_items: [
    { description: 'A4 Copy Paper, 80gsm (box of 5 reams)', description_citations: ['/page/0/Table/8'], amount: 294.0, amount_citations: ['/page/0/Table/8'] },
    { description: 'Recycled Envelopes C5 (pack of 500)', description_citations: ['/page/0/Table/8'], amount: 75.0, amount_citations: ['/page/0/Table/8'] },
  ],
};

const balancedResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'markdown',
  markdown: '# Invoice INV-2026-0042',
  json: null,
  html: null,
  chunks: null,
  extraction_schema_json: JSON.stringify(balancedExtraction),
  extraction_score_average: null,
  extraction_scoring_status: null,
  extraction_mode: 'balanced',
  page_count: 2,
  total_cost: 5.0,
  runtime: 35.98,
};

const phraseCitation = { block: '/page/0/Text/1', page: 0, text: 'INV-2026-0042', offset: 16, length: 13, score: 1.0, bbox: [354.0, 228.0, 550.0, 262.0] };

const fastPhraseResult = {
  status: 'complete',
  success: true,
  markdown: '# Invoice',
  extraction_schema_json: JSON.stringify({
    invoice_number: 'INV-2026-0042',
    invoice_number_citations: [phraseCitation],
    invoice_number_score: 5,
    line_items: [
      {
        quantity: 20,
        quantity_citations: [{ block: '/page/0/Table/8', page: 0 }],
        quantity_score: 4,
      },
    ],
    purchase_order_number: null,
    purchase_order_number_citations: [],
  }),
  extraction_score_average: 4.5,
  extraction_scoring_status: 'complete',
  extraction_mode: 'fast',
  page_count: 2,
};

const turboResult = {
  status: 'complete',
  success: true,
  output_format: 'json',
  extraction_schema_json: JSON.stringify({
    invoice_number: 'INV-2026-0042',
    total_due: 586.67,
    vendor: { name: 'Northwind Paper Supplies Ltd', vat_id: 'GB123456789' },
    line_items: [{ description: 'Thermal Label Rolls 100x150mm', quantity: 20, amount: 124.0 }],
    purchase_order_number: null,
  }),
  extraction_score_average: null,
  extraction_mode: 'turbo',
  page_count: 2,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fieldsToSchema', () => {
  it('turns a field list into an object schema with types, descriptions and required names', () => {
    const schema = extractOperation.fieldsToSchema([
      { name: ' invoice_number ', description: 'The invoice number', type: 'string', required: true },
      { name: 'total', type: 'number', required: false },
      { name: 'paid', type: 'boolean' },
      { name: 'notes', type: 'date' },
    ]);
    expect(schema).toEqual({
      type: 'object',
      properties: {
        invoice_number: { type: 'string', description: 'The invoice number' },
        total: { type: 'number' },
        paid: { type: 'boolean' },
        notes: { type: 'string' },
      },
      required: ['invoice_number'],
    });
  });

  it('leaves out required when no field is required', () => {
    expect(extractOperation.fieldsToSchema([{ name: 'a', type: 'string' }])).toEqual({ type: 'object', properties: { a: { type: 'string' } } });
  });

  it('rejects an empty list, an empty name and a duplicate name', () => {
    expect(() => extractOperation.fieldsToSchema([])).toThrow('Add at least one field');
    expect(() => extractOperation.fieldsToSchema(undefined)).toThrow('Add at least one field');
    expect(() => extractOperation.fieldsToSchema([{ name: 'a' }, { name: '  ' }])).toThrow('Field 2 under Fields to Extract has no name');
    expect(() => extractOperation.fieldsToSchema([{ name: 'total' }, { name: ' total' }])).toThrow('"total" is used more than once');
  });
});

describe('checkSchema', () => {
  it('accepts an object and a JSON string, and pins the root type to object', () => {
    expect(extractOperation.checkSchema(invoiceSchema)).toEqual(invoiceSchema);
    expect(extractOperation.checkSchema(JSON.stringify({ properties: { a: { type: 'string' } } }))).toEqual({ type: 'object', properties: { a: { type: 'string' } } });
  });

  it('rejects a schema without properties, the shape Datalab answers with a 400', () => {
    expect(() => extractOperation.checkSchema({ type: 'object' })).toThrow('needs a "properties" object');
    expect(() => extractOperation.checkSchema({ type: 'object', properties: {} })).toThrow('needs a "properties" object');
    expect(() => extractOperation.checkSchema({ invoice_number: { type: 'string' } })).toThrow('needs a "properties" object');
  });

  it('rejects text that is not JSON, a non-object root and a missing schema', () => {
    expect(() => extractOperation.checkSchema('{invoice_number: string}')).toThrow('The JSON Schema is not valid JSON');
    expect(() => extractOperation.checkSchema({ type: 'array', properties: { a: {} } })).toThrow('must describe an object');
    expect(() => extractOperation.checkSchema('[1, 2]')).toThrow('must be a JSON object');
    expect(() => extractOperation.checkSchema({ type: 'object', properties: { a: 'string' } })).toThrow('Field "a" in the JSON Schema must be an object');
    expect(() => extractOperation.checkSchema(undefined)).toThrow('Give the JSON Schema');
    expect(() => extractOperation.checkSchema('  ')).toThrow('Give the JSON Schema');
  });
});

describe('form fields sent to Datalab', () => {
  it('sends a human run with the file, the schema as a JSON string and every chosen option', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(balancedResult));
    const input = extractOperation.readHuman({
      source: 'file',
      file: { filename: 'invoice.pdf', extension: 'pdf', data: Buffer.from('%PDF-1.4 test') },
      file_url: undefined,
      schema_type: 'simple',
      schema: { fields: [{ name: 'invoice_number', type: 'string', required: true }] },
      extraction_mode: 'accurate',
      page_range: '0, 2-3',
      max_pages: 4,
      citation_granularity: 'phrase',
      parse_mode: 'balanced',
      skip_cache: true,
    });
    const output = await extractOperation.run({ apiKey: 'key_1', audience: 'human', input, timing: fakeTiming() });
    expect(output.completed).toBe(true);
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://www.datalab.to/api/v1/extract');
    const form = formOf(request.body);
    expect(form['file']).toBeInstanceOf(Blob);
    expect(form).toMatchObject({
      page_schema: '{"type":"object","properties":{"invoice_number":{"type":"string"}},"required":["invoice_number"]}',
      extraction_mode: 'accurate',
      mode: 'balanced',
      citation_granularity: 'phrase',
      page_range: '0,2-3',
      skip_cache: 'true',
    });
    expect(form).not.toHaveProperty('max_pages');
    expect(spy.mock.calls[1][0].url).toBe('https://www.datalab.to/api/v1/extract/req_x');
  });

  it('falls back to balanced and block citations when a human leaves the options empty, and sends no parse mode', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(balancedResult));
    const input = extractOperation.readHuman({
      source: 'url',
      file_url: 'https://example.com/invoice.pdf',
      schema_type: 'advanced',
      schema: { json_schema: JSON.stringify(invoiceSchema) },
      extraction_mode: null,
      citation_granularity: undefined,
      parse_mode: null,
      skip_cache: undefined,
    });
    await extractOperation.run({ apiKey: 'k', audience: 'human', input, timing: fakeTiming() });
    expect(formOf(spy.mock.calls[0][0].body)).toEqual({
      file_url: 'https://example.com/invoice.pdf',
      page_schema: JSON.stringify(invoiceSchema),
      extraction_mode: 'balanced',
      citation_granularity: 'block',
      skip_cache: 'false',
    });
  });

  it('sends an AI turbo run with no citation detail and no parse mode', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(turboResult));
    const input = extractOperation.readAi({
      file_url: 'https://example.com/invoice.pdf',
      json_schema: JSON.stringify(invoiceSchema),
      extraction_mode: 'Turbo',
      citation_granularity: 'phrase',
      skip_cache: false,
    });
    const output = await extractOperation.run({ apiKey: 'k', audience: 'ai', input, timing: fakeTiming() });
    expect(output.completed).toBe(true);
    const form = formOf(spy.mock.calls[0][0].body);
    expect(form).toEqual({ file_url: 'https://example.com/invoice.pdf', page_schema: JSON.stringify(invoiceSchema), extraction_mode: 'turbo', skip_cache: 'false' });
    expect(form).not.toHaveProperty('mode');
    expect(form).not.toHaveProperty('citation_granularity');
  });

  it('accepts an AI schema given as an object and treats omitted agent values as defaults', () => {
    const input = extractOperation.readAi({ file_url: 'https://example.com/a.pdf', json_schema: invoiceSchema, extraction_mode: undefined, citation_granularity: undefined, page_range: '', max_pages: null, skip_cache: false });
    expect(extractOperation.formFields(input)).toMatchObject({ page_schema: JSON.stringify(invoiceSchema), extraction_mode: 'balanced', citation_granularity: 'block', mode: undefined, page_range: undefined, max_pages: undefined, skip_cache: false });
  });

  it('keeps the Simple list and the Advanced schema under different keys, so a value left by one never reaches the other form', () => {
    expect(Object.keys(extractOperation.simpleSchemaProps())).toEqual(['fields']);
    expect(Object.keys(extractOperation.advancedSchemaProps())).toEqual(['json_schema']);
  });

  it('reads only the chosen variant when the builder still holds the value of the other one', () => {
    const leftovers = { fields: [{ name: 'invoice_number', type: 'string' }], json_schema: invoiceSchema };
    const simple = extractOperation.readHuman({ source: 'url', file_url: 'https://example.com/a.pdf', schema_type: 'simple', schema: leftovers });
    expect(simple.schema).toEqual({ type: 'object', properties: { invoice_number: { type: 'string' } } });
    const advanced = extractOperation.readHuman({ source: 'url', file_url: 'https://example.com/a.pdf', schema_type: 'advanced', schema: leftovers });
    expect(advanced.schema).toEqual(invoiceSchema);
  });

  it('asks for a JSON Schema when Advanced is chosen and only a Simple list is left in the form', () => {
    expect(() => extractOperation.readHuman({ source: 'url', file_url: 'https://example.com/a.pdf', schema_type: 'advanced', schema: { fields: [{ name: 'invoice_number', type: 'string' }] } })).toThrow('Give the JSON Schema of the fields to extract');
  });

  it('checks the schema and mode before calling Datalab', () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    expect(() => extractOperation.readAi({ file_url: 'https://example.com/a.pdf', json_schema: { type: 'object' } })).toThrow('needs a "properties" object');
    expect(() => extractOperation.readAi({ file_url: 'https://example.com/a.pdf', json_schema: invoiceSchema, extraction_mode: 'quick' })).toThrow('Extraction Mode "quick" is not known');
    expect(() => extractOperation.readHuman({ source: 'url', file_url: 'https://example.com/a.pdf', schema_type: 'simple', schema: {} })).toThrow('Add at least one field');
    expect(() => extractOperation.readAi({ file_url: '', json_schema: invoiceSchema })).toThrow('Give file_url');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('shape', () => {
  it('splits a balanced result into clean data, citations and details at every level, and drops the parsed document', async () => {
    const output = await extractOperation.shape({ result: balancedResult });
    expect(output.data).toEqual({
      invoice_number: 'INV-2026-0042',
      vendor: { name: 'Northwind Paper Supplies Ltd' },
      purchase_order_number: null,
      line_items: [
        { description: 'A4 Copy Paper, 80gsm (box of 5 reams)', amount: 294.0 },
        { description: 'Recycled Envelopes C5 (pack of 500)', amount: 75.0 },
      ],
    });
    expect(output.citations).toEqual({
      invoice_number: ['/page/0/Text/1'],
      'vendor.name': ['/page/0/Text/5'],
      purchase_order_number: [],
      'line_items[0].description': ['/page/0/Table/8'],
      'line_items[0].amount': ['/page/0/Table/8'],
      'line_items[1].description': ['/page/0/Table/8'],
      'line_items[1].amount': ['/page/0/Table/8'],
    });
    expect(output.details['invoice_number']).toEqual(balancedExtraction.invoice_number_meta);
    expect(output.details['vendor.name']).toMatchObject({ extraction_status: 'EXTRACTED' });
    expect(output.details['purchase_order_number']).toMatchObject({ extraction_status: 'NOT_RESOLVABLE', verification: { status: 'FAIL_UNRESOLVABLE' } });
    expect(Object.keys(output.details)).toEqual(['invoice_number', 'vendor.name', 'purchase_order_number']);
    expect(output).toMatchObject({ score_average: null, extraction_mode: 'balanced', page_count: 2 });
    for (const key of ['markdown', 'json', 'html', 'chunks', 'extraction_schema_json', 'completed', 'status', 'request_id']) {
      expect(output).not.toHaveProperty(key);
    }
  });

  it('keeps phrase citations as sent and puts fast-mode scores into details', async () => {
    const output = await extractOperation.shape({ result: fastPhraseResult });
    expect(output.data).toEqual({ invoice_number: 'INV-2026-0042', line_items: [{ quantity: 20 }], purchase_order_number: null });
    expect(output.citations).toEqual({
      invoice_number: [phraseCitation],
      'line_items[0].quantity': [{ block: '/page/0/Table/8', page: 0 }],
      purchase_order_number: [],
    });
    expect(output.details).toEqual({ invoice_number: { score: 5 }, 'line_items[0].quantity': { score: 4 } });
    expect(output).toMatchObject({ score_average: 4.5, extraction_mode: 'fast' });
  });

  it('merges a score into the meta of the same field', () => {
    const split = extractOperation.split({ extracted: { total: 5, total_score: 3, total_meta: { extraction_status: 'EXTRACTED' } } });
    expect(split.details).toEqual({ total: { score: 3, extraction_status: 'EXTRACTED' } });
  });

  it('returns a turbo result unchanged with empty citations and details', async () => {
    const output = await extractOperation.shape({ result: turboResult });
    expect(output.data).toEqual({
      invoice_number: 'INV-2026-0042',
      total_due: 586.67,
      vendor: { name: 'Northwind Paper Supplies Ltd', vat_id: 'GB123456789' },
      line_items: [{ description: 'Thermal Label Rolls 100x150mm', quantity: 20, amount: 124.0 }],
      purchase_order_number: null,
    });
    expect(output.citations).toEqual({});
    expect(output.details).toEqual({});
    expect(output).toMatchObject({ extraction_mode: 'turbo', page_count: 2, score_average: null });
  });

  it('keeps a user field named like a helper when its base field is not beside it', () => {
    const split = extractOperation.split({
      extracted: {
        order_meta: 'from the user',
        order_meta_citations: ['/page/0/Text/2'],
        shipping_score: 7,
        nested: { review_citations: 'kept', items: [{ x_meta: 1 }] },
      },
    });
    expect(split.data).toEqual({ order_meta: 'from the user', shipping_score: 7, nested: { review_citations: 'kept', items: [{ x_meta: 1 }] } });
    expect(split.citations).toEqual({ order_meta: ['/page/0/Text/2'] });
  });

  it('accepts extraction_schema_json as an object, as a downloaded result sends it', async () => {
    const output = await extractOperation.shape({ result: { extraction_schema_json: balancedExtraction, extraction_mode: 'balanced' } });
    expect(output.citations['vendor.name']).toEqual(['/page/0/Text/5']);
    expect(output.page_count).toBeNull();
  });

  it('throws a clear error when the extracted data is not valid JSON or missing', async () => {
    await expect(extractOperation.shape({ result: { extraction_schema_json: '{"a": ' } })).rejects.toThrow('not valid JSON');
    await expect(extractOperation.shape({ result: { extraction_schema_json: null } })).rejects.toThrow('sent no extracted data');
  });
});

describe('user fields that look like helper keys', () => {
  const riskSchema = { type: 'object', properties: { risk: { type: 'string' }, risk_score: { type: 'number' } } };
  const fastRisk = { risk: 'high', risk_citations: ['/page/0/Text/1'], risk_score: 8, risk_score_citations: ['/page/0/Text/2'] };

  it('keeps risk and risk_score in fast-mode output, with and without the schema', async () => {
    const result = { extraction_schema_json: JSON.stringify(fastRisk), extraction_mode: 'fast' };
    for (const options of [undefined, { schema: riskSchema }]) {
      const output = await extractOperation.shape({ result, options });
      expect(output.data).toEqual({ risk: 'high', risk_score: 8 });
      expect(output.citations).toEqual({ risk: ['/page/0/Text/1'], risk_score: ['/page/0/Text/2'] });
      expect(output.details).toEqual({});
    }
  });

  it('keeps a declared field even when Datalab sent no helpers for it, on the normal run path', async () => {
    const extracted = { risk: 'high', risk_citations: ['/page/0/Text/1'], risk_score: 8 };
    expect(extractOperation.split({ extracted, schema: riskSchema }).data).toEqual({ risk: 'high', risk_score: 8 });
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(submitted)
      .mockResolvedValueOnce(ok({ status: 'complete', success: true, extraction_schema_json: JSON.stringify(extracted), extraction_mode: 'fast', page_count: 1 }));
    const input = extractOperation.readAi({ file_url: 'https://example.com/a.pdf', json_schema: riskSchema, extraction_mode: 'fast' });
    const output = await extractOperation.run({ apiKey: 'k', audience: 'ai', input, timing: fakeTiming() });
    expect(output).toMatchObject({ completed: true, data: { risk: 'high', risk_score: 8 } });
  });

  it('never splits a turbo result', async () => {
    const output = await extractOperation.shape({ result: { extraction_schema_json: JSON.stringify({ risk: 'high', risk_score: 8, paper: 'A4', paper_citations: [1] }), extraction_mode: 'turbo' } });
    expect(output.data).toEqual({ risk: 'high', risk_score: 8, paper: 'A4', paper_citations: [1] });
    expect(output.citations).toEqual({});
    expect(output.details).toEqual({});
  });

  it('keeps a key whose value does not have the helper shape', () => {
    const split = extractOperation.split({ extracted: { paper: 'A4', paper_citations: 3, size: 'L', size_meta: 'cotton', grade: 'B', grade_score: 'high' } });
    expect(split.data).toEqual({ paper: 'A4', paper_citations: 3, size: 'L', size_meta: 'cotton', grade: 'B', grade_score: 'high' });
    expect(split.citations).toEqual({});
    expect(split.details).toEqual({});
  });

  it('handles the same collision inside a nested object and an array item, with and without the schema', () => {
    const extracted = {
      vendor: { credit: 'good', credit_citations: ['/page/0/Text/3'], credit_score: 720, credit_score_citations: ['/page/0/Text/4'] },
      items: [{ risk: 'low', risk_citations: [], risk_score: 2, risk_score_citations: ['/page/1/Text/1'] }],
    };
    const schema = {
      type: 'object',
      properties: {
        vendor: { type: 'object', properties: { credit: { type: 'string' }, credit_score: { type: 'number' } } },
        items: { type: 'array', items: { type: 'object', properties: { risk: { type: 'string' }, risk_score: { type: 'number' } } } },
      },
    };
    for (const split of [extractOperation.split({ extracted }), extractOperation.split({ extracted, schema })]) {
      expect(split.data).toEqual({ vendor: { credit: 'good', credit_score: 720 }, items: [{ risk: 'low', risk_score: 2 }] });
      expect(split.citations).toEqual({
        'vendor.credit': ['/page/0/Text/3'],
        'vendor.credit_score': ['/page/0/Text/4'],
        'items[0].risk': [],
        'items[0].risk_score': ['/page/1/Text/1'],
      });
      expect(split.details).toEqual({});
    }
  });

  it('still moves a genuine _score helper into details', () => {
    const split = extractOperation.split({ extracted: { total: 586.67, total_citations: ['/page/0/Text/11'], total_score: 5, po: null, po_citations: [], po_score: null } });
    expect(split.data).toEqual({ total: 586.67, po: null });
    expect(split.details).toEqual({ total: { score: 5 } });
  });
});

describe('hasOutput', () => {
  it('is true only when the result carries extracted data', () => {
    expect(extractOperation.hasOutput(balancedResult)).toBe(true);
    expect(extractOperation.hasOutput({ extraction_schema_json: { a: 1 } })).toBe(true);
    expect(extractOperation.hasOutput({ status: 'complete', markdown: '# Hi', extraction_schema_json: null })).toBe(false);
    expect(extractOperation.hasOutput({ status: 'complete', markdown: '# Hi' })).toBe(false);
    expect(extractOperation.hasOutput({ extraction_schema_json: '' })).toBe(false);
  });
});

describe('when the wait runs out', () => {
  const input = () => extractOperation.readAi({ file_url: 'https://example.com/a.pdf', json_schema: invoiceSchema });

  it('fails the human action with the request ID and Get Result', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    await expect(extractOperation.run({ apiKey: 'k', audience: 'human', input: input(), timing: fakeTiming() })).rejects.toThrow(
      /Timed out waiting for Datalab: it is still processing request req_x after 4 minutes.*Get Result action with Operation "Extract Structured Data"/,
    );
  });

  it('returns completed false with the request ID to the AI twin', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    const output = await extractOperation.run({ apiKey: 'k', audience: 'ai', input: input(), timing: fakeTiming() });
    expect(output).toMatchObject({ completed: false, status: 'processing', request_id: 'req_x' });
    expect(output).toHaveProperty('message');
  });
});

describe('outputSchema', () => {
  it('starts with the envelope and describes the extract fields', () => {
    const keys = extractOperation.outputSchema.fields.map((field) => field.key);
    expect(keys).toEqual(['completed', 'status', 'request_id', 'message', 'data', 'citations', 'details', 'score_average', 'extraction_mode', 'page_count']);
    const data = extractOperation.outputSchema.fields.find((field) => field.key === 'data');
    expect(data?.children).toBeUndefined();
  });
});

describe('fast-mode scores as Datalab really sends them (live run 2026-11-13)', () => {
  const live = {
    total_due: 586.67,
    total_due_citations: ['/page/0/Text/11'],
    total_due_score: 3,
    total_due_score_citations: ['/page/0/Text/11'],
    vendor: {
      name: 'Northwind Paper Supplies Ltd',
      name_citations: ['/page/0/Text/5'],
      name_score: { score: 5, reasoning: 'Vendor name is correctly extracted.' },
      name_meta: 'GB123456789',
      name_meta_citations: ['/page/0/Text/5'],
      name_meta_score: { score: 4, reasoning: 'VAT ID is correctly extracted.' },
    },
  };
  const schema = {
    type: 'object',
    properties: {
      total_due: { type: 'number' },
      total_due_score: { type: 'number' },
      vendor: { type: 'object', properties: { name: { type: 'string' }, name_meta: { type: 'string' } } },
    },
  };

  const variants: Array<{ label: string; given: Record<string, unknown> | undefined }> = [
    { label: 'with the schema', given: schema },
    { label: 'without the schema, as Get Result runs', given: undefined },
  ];
  for (const { label, given } of variants) {
    it(`moves score objects to details and keeps the user fields named like helpers, ${label}`, () => {
      const { data, citations, details } = extractOperation.split({ extracted: live, schema: given });
      expect(data).toEqual({ total_due: 586.67, total_due_score: 3, vendor: { name: 'Northwind Paper Supplies Ltd', name_meta: 'GB123456789' } });
      expect(Object.keys(citations).sort()).toEqual(['total_due', 'total_due_score', 'vendor.name', 'vendor.name_meta']);
      expect(details).toEqual({
        'vendor.name': { score: 5, score_reasoning: 'Vendor name is correctly extracted.' },
        'vendor.name_meta': { score: 4, score_reasoning: 'VAT ID is correctly extracted.' },
      });
    });
  }
});
