/// <reference types="vitest/globals" />

import { submissionSample } from '../src/lib/triggers/submission-sample';

const findSubmissions = vi.fn();

vi.mock('../src/lib/common/client', () => ({
  formioCommon: {
    findSubmissions: (...args: unknown[]) => findSubmissions(...args),
  },
}));

const auth = { props: { projectUrl: 'https://forms.example.gov', apiKey: 'k' } };
const propsValue = { formPath: 'citizen-intake' };

function submission({
  id,
  created,
  modified,
}: {
  id: string;
  created: string;
  modified?: string;
}) {
  return {
    _id: id,
    form: 'f1',
    data: { fullName: id },
    created,
    modified: modified ?? created,
  };
}

async function fetchSample({
  timestampField,
  rows,
  formPath = propsValue.formPath,
}: {
  timestampField: 'created' | 'modified';
  rows: ReturnType<typeof submission>[];
  formPath?: string;
}) {
  findSubmissions.mockResolvedValueOnce({ submissions: rows, total: rows.length });
  const sample = submissionSample(timestampField);
  const items = await sample.items({ auth, propsValue: { formPath } } as never);
  const call = findSubmissions.mock.calls.at(-1)?.[0];
  return { items, query: call?.queryParams, formPath: call?.formPath };
}

describe('submission sample data', () => {
  beforeEach(() => findSubmissions.mockReset());

  test('the newest submissions are asked for, so a sample is recognisable to whoever is building the flow', async () => {
    const { query } = await fetchSample({ timestampField: 'created', rows: [] });

    expect(query.sort).toBe('-created');
  });

  test('the sample sorts on the field its trigger fires for', async () => {
    const { query } = await fetchSample({ timestampField: 'modified', rows: [] });

    expect(query.sort).toBe('-modified');
  });

  test('a page size is always requested, so one sample cannot pull an unbounded list', async () => {
    const { query } = await fetchSample({ timestampField: 'created', rows: [] });

    expect(Number(query.limit)).toBeGreaterThan(0);
  });

  test('no timestamp filter is sent, since a sample is not resuming from anywhere', async () => {
    const { query } = await fetchSample({ timestampField: 'created', rows: [] });

    expect(query['created__gt']).toBeUndefined();
    expect(query['modified__gt']).toBeUndefined();
  });

  test('the updated sample skips submissions that have never been edited', async () => {
    const { items } = await fetchSample({
      timestampField: 'modified',
      rows: [
        submission({ id: 'untouched', created: '2026-09-02T10:00:00.000Z' }),
        submission({
          id: 'edited',
          created: '2026-09-01T09:00:00.000Z',
          modified: '2026-09-02T11:00:00.000Z',
        }),
      ],
    });

    expect(items.map((item) => (item.data as { _id: string })._id)).toEqual(['edited']);
  });

  test('the new-submission sample keeps every row, edited or not', async () => {
    const { items } = await fetchSample({
      timestampField: 'created',
      rows: [
        submission({ id: 'a', created: '2026-09-02T10:00:00.000Z' }),
        submission({
          id: 'b',
          created: '2026-09-02T10:00:01.000Z',
          modified: '2026-09-02T12:00:00.000Z',
        }),
      ],
    });

    expect(items).toHaveLength(2);
  });

  test('the reported timestamp comes from the field being sampled', async () => {
    const { items } = await fetchSample({
      timestampField: 'modified',
      rows: [
        submission({
          id: 's1',
          created: '2026-09-01T00:00:00.000Z',
          modified: '2026-09-02T10:00:00.000Z',
        }),
      ],
    });

    expect(items[0].epochMilliSeconds).toBe(Date.parse('2026-09-02T10:00:00.000Z'));
  });

  test('an unparseable timestamp becomes 0 rather than NaN', async () => {
    const { items } = await fetchSample({
      timestampField: 'created',
      rows: [{ _id: 'x', form: 'f1', data: {}, created: 'not a date' } as never],
    });

    expect(items[0].epochMilliSeconds).toBe(0);
    expect(Number.isNaN(items[0].epochMilliSeconds)).toBe(false);
  });

  test('the form chosen in the step is the form queried', async () => {
    const { formPath } = await fetchSample({
      timestampField: 'created',
      rows: [],
      formPath: 'permit-renewal',
    });

    expect(formPath).toBe('permit-renewal');
  });
});
