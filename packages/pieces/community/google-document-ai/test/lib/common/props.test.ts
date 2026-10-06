import { beforeEach, describe, expect, it, vi } from 'vitest';

const listProcessors = vi.hoisted(() => vi.fn<() => Promise<unknown>>());
const resolveAuth = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleDocumentAiApi: { listProcessors } };
});
vi.mock('../../../src/lib/common/token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/token')>();
  return { ...actual, resolveAuth };
});

const { processorLabel, processorOptions, processorTypeLabel } = await import('../../../src/lib/common/props');

beforeEach(() => {
  listProcessors.mockReset();
  resolveAuth.mockReset();
  resolveAuth.mockResolvedValue({ accessToken: 't', projectId: 'p', location: 'us' });
});

describe('processorTypeLabel() / processorLabel()', () => {
  it('should turn type ids into readable labels and compose the option label', () => {
    expect(processorTypeLabel('OCR_PROCESSOR')).toBe('OCR');
    expect(processorTypeLabel('FORM_PARSER_PROCESSOR')).toBe('Form parser');
    expect(processorTypeLabel('CUSTOM_EXTRACTION_PROCESSOR')).toBe('Custom extraction');
    expect(processorTypeLabel(undefined)).toBe('unknown type');
    expect(processorLabel({ name: 'projects/1/locations/us/processors/abc', displayName: 'Invoices', type: 'INVOICE_PROCESSOR', state: 'ENABLED' })).toBe('Invoices (Invoice) · abc');
    expect(processorLabel({ name: 'projects/1/locations/us/processors/abc', type: 'OCR_PROCESSOR', state: 'DISABLED' })).toBe('abc (OCR) · disabled · abc');
  });
});

describe('processorOptions()', () => {
  it('should ask for a connection when there is none', async () => {
    expect(await processorOptions(undefined)).toEqual({ disabled: true, options: [], placeholder: 'Please select an existing or create a new connection.' });
    expect(listProcessors).not.toHaveBeenCalled();
  });

  it('should list processors sorted by label with the resource name as value', async () => {
    listProcessors.mockResolvedValue([
      { name: 'projects/1/locations/us/processors/b', displayName: 'Zeta OCR', type: 'OCR_PROCESSOR', state: 'ENABLED' },
      { name: 'projects/1/locations/us/processors/a', displayName: 'Alpha forms', type: 'FORM_PARSER_PROCESSOR', state: 'ENABLED' },
    ]);

    const state = await processorOptions({ type: 'OAUTH2', access_token: 't' });

    expect(state).toEqual({
      disabled: false,
      options: [
        { label: 'Alpha forms (Form parser) · a', value: 'projects/1/locations/us/processors/a' },
        { label: 'Zeta OCR (OCR) · b', value: 'projects/1/locations/us/processors/b' },
      ],
    });
  });

  it('should explain an empty project and degrade with the API error', async () => {
    listProcessors.mockResolvedValueOnce([]);
    expect(await processorOptions({ type: 'OAUTH2', access_token: 't' })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('No processors in project p, location us') });

    listProcessors.mockRejectedValueOnce(new Error('Google Document AI returned 403 (PERMISSION_DENIED): nope'));
    expect(await processorOptions({ type: 'OAUTH2', access_token: 't' })).toMatchObject({ disabled: true, placeholder: 'Could not list processors: Google Document AI returned 403 (PERMISSION_DENIED): nope' });
  });
});
