import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customFieldsHelper, ProjectField } from '../src/lib/common/custom-fields';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = { type: AppConnectionType.CUSTOM_AUTH, props: { baseUrl: 'https://x.youtrack.cloud', apiToken: 'perm:x' } };

function schemaRow({ name, id, multi }: { name: string; id: string; multi?: boolean }) {
  return { field: { name, fieldType: { id, isMultiValue: multi ?? id.endsWith('[*]') } } };
}

function field({ id, multi }: { id: string; multi?: boolean }): ProjectField {
  const parsed = customFieldsHelper.toProjectField(schemaRow({ name: 'F', id, multi }));
  if (parsed === null) throw new Error('no field');
  return parsed;
}

const SCHEMA = [
  schemaRow({ name: 'Priority', id: 'enum[1]' }),
  schemaRow({ name: 'Labels', id: 'enum[*]' }),
  schemaRow({ name: 'State', id: 'state[1]' }),
  schemaRow({ name: 'Assignee', id: 'user[1]' }),
  schemaRow({ name: 'Reviewers', id: 'user[*]' }),
  schemaRow({ name: 'Estimation', id: 'period' }),
  schemaRow({ name: 'Due Date', id: 'date' }),
  schemaRow({ name: 'Started', id: 'date and time' }),
  schemaRow({ name: 'Story Points', id: 'integer' }),
  schemaRow({ name: 'Risk', id: 'float' }),
  schemaRow({ name: 'Customer', id: 'string' }),
  schemaRow({ name: 'Notes', id: 'text' }),
];

beforeEach(() => {
  sendRequest.mockReset();
});

describe('issue $type per field type (RESEARCH table)', () => {
  const rows: Array<[string, boolean, string]> = [
    ['enum[1]', false, 'SingleEnumIssueCustomField'],
    ['enum[*]', true, 'MultiEnumIssueCustomField'],
    ['build[1]', false, 'SingleBuildIssueCustomField'],
    ['build[*]', true, 'MultiBuildIssueCustomField'],
    ['state[1]', false, 'StateIssueCustomField'],
    ['version[1]', false, 'SingleVersionIssueCustomField'],
    ['version[*]', true, 'MultiVersionIssueCustomField'],
    ['ownedField[1]', false, 'SingleOwnedIssueCustomField'],
    ['ownedField[*]', true, 'MultiOwnedIssueCustomField'],
    ['user[1]', false, 'SingleUserIssueCustomField'],
    ['user[*]', true, 'MultiUserIssueCustomField'],
    ['group[1]', false, 'SingleGroupIssueCustomField'],
    ['group[*]', true, 'MultiGroupIssueCustomField'],
    ['integer', false, 'SimpleIssueCustomField'],
    ['float', false, 'SimpleIssueCustomField'],
    ['date', false, 'DateIssueCustomField'],
    ['date and time', false, 'SimpleIssueCustomField'],
    ['period', false, 'PeriodIssueCustomField'],
    ['string', false, 'SimpleIssueCustomField'],
    ['text', false, 'TextIssueCustomField'],
  ];
  it.each(rows)('%s -> %s', (id, multi, type) => {
    const parsed = field({ id, multi });
    expect(parsed.isMultiValue).toBe(multi);
    expect(parsed.issueFieldType).toBe(type);
  });

  it('reads cardinality from the [*] suffix when isMultiValue is absent', () => {
    const parsed = customFieldsHelper.toProjectField({ field: { name: 'L', fieldType: { id: 'enum[*]' } } });
    expect(parsed?.issueFieldType).toBe('MultiEnumIssueCustomField');
  });
});

describe('value coercion', () => {
  it('maps every kind to its wire shape', () => {
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'enum[1]' }), value: 'Critical' })).toEqual({ name: 'Critical' });
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'enum[*]' }), value: ['a', { name: 'b' }] })).toEqual([{ name: 'a' }, { name: 'b' }]);
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'enum[*]' }), value: 'a' })).toEqual([{ name: 'a' }]);
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'user[1]' }), value: 'jane' })).toEqual({ login: 'jane' });
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'user[*]' }), value: ['jane', { id: '1-2' }] })).toEqual([{ login: 'jane' }, { id: '1-2' }]);
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'period' }), value: '2h 30m' })).toEqual({ presentation: '2h 30m' });
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'period' }), value: 90 })).toEqual({ minutes: 90 });
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'period' }), value: '90' })).toEqual({ minutes: 90 });
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'text' }), value: 'hello' })).toEqual({ text: 'hello' });
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'string' }), value: 'ACME' })).toBe('ACME');
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'integer' }), value: '5' })).toBe(5);
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'float' }), value: '2.5' })).toBe(2.5);
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'date' }), value: '2026-12-01' })).toBe(Date.UTC(2026, 11, 1, 12));
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'date' }), value: Date.UTC(2026, 11, 1, 12) })).toBe(Date.UTC(2026, 11, 1, 12));
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'date and time' }), value: '2026-12-01T09:30:00+02:00' })).toBe(Date.UTC(2026, 11, 1, 7, 30));
  });

  it('null clears a single field and empties a multi field', () => {
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'enum[1]' }), value: null })).toBeNull();
    expect(customFieldsHelper.coerceValue({ field: field({ id: 'enum[*]' }), value: null })).toEqual([]);
  });

  it('parses strictly', () => {
    expect(() => customFieldsHelper.coerceValue({ field: field({ id: 'integer' }), value: '5.5' })).toThrow('whole number');
    expect(() => customFieldsHelper.coerceValue({ field: field({ id: 'float' }), value: '2,5' })).toThrow('needs a number');
    expect(() => customFieldsHelper.coerceValue({ field: field({ id: 'date' }), value: '01.12.2026' })).toThrow('YYYY-MM-DD');
    expect(() => customFieldsHelper.coerceValue({ field: field({ id: 'date and time' }), value: '2026-12-01T09:30' })).toThrow('time zone');
    expect(() => customFieldsHelper.coerceValue({ field: field({ id: 'enum[1]' }), value: ['a', 'b'] })).toThrow('holds one value');
    expect(() => customFieldsHelper.coerceValue({ field: field({ id: 'user[1]' }), value: 5 })).toThrow('user login');
  });
});

describe('resolveCustomFields', () => {
  const loadFields = async () => (await customFieldsHelper.fieldsForProject({ auth: AUTH, projectId: '0-5', withValues: false })).fields;

  it('treats empty input like main did', async () => {
    for (const value of [undefined, null, {}, [], '']) {
      expect(await customFieldsHelper.resolveCustomFields({ loadFields, value })).toBeUndefined();
    }
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('forwards a full $type array unchanged without reading the schema', async () => {
    const legacy = [{ name: 'Priority', $type: 'SingleEnumIssueCustomField', value: { name: 'Critical' } }];
    expect(await customFieldsHelper.resolveCustomFields({ loadFields, value: legacy })).toStrictEqual(legacy);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('maps a name -> value map for every kind', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: SCHEMA });
    const out = await customFieldsHelper.resolveCustomFields({
      loadFields,
      value: {
        priority: 'Critical',
        Labels: ['a', 'b'],
        State: 'Open',
        Assignee: 'jane',
        Reviewers: ['bob'],
        Estimation: '2h',
        'Due Date': '2026-12-01',
        Started: '2026-12-01T09:00:00Z',
        'Story Points': 3,
        Risk: 0.5,
        Customer: 'ACME',
        Notes: null,
      },
    });
    expect(sendRequest.mock.calls[0][0].url).toBe('https://x.youtrack.cloud/api/admin/projects/0-5/customFields');
    expect(sendRequest.mock.calls[0][0].queryParams).toMatchObject({ $top: '100', $skip: '0' });
    expect(out).toEqual([
      { name: 'Priority', $type: 'SingleEnumIssueCustomField', value: { name: 'Critical' } },
      { name: 'Labels', $type: 'MultiEnumIssueCustomField', value: [{ name: 'a' }, { name: 'b' }] },
      { name: 'State', $type: 'StateIssueCustomField', value: { name: 'Open' } },
      { name: 'Assignee', $type: 'SingleUserIssueCustomField', value: { login: 'jane' } },
      { name: 'Reviewers', $type: 'MultiUserIssueCustomField', value: [{ login: 'bob' }] },
      { name: 'Estimation', $type: 'PeriodIssueCustomField', value: { presentation: '2h' } },
      { name: 'Due Date', $type: 'DateIssueCustomField', value: Date.UTC(2026, 11, 1, 12) },
      { name: 'Started', $type: 'SimpleIssueCustomField', value: Date.UTC(2026, 11, 1, 9) },
      { name: 'Story Points', $type: 'SimpleIssueCustomField', value: 3 },
      { name: 'Risk', $type: 'SimpleIssueCustomField', value: 0.5 },
      { name: 'Customer', $type: 'SimpleIssueCustomField', value: 'ACME' },
      { name: 'Notes', $type: 'TextIssueCustomField', value: null },
    ]);
  });

  it('infers $type for array entries that lack it and keeps those that have it', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: SCHEMA });
    const out = await customFieldsHelper.resolveCustomFields({
      loadFields,
      value: [
        { name: 'Assignee', value: 'jane' },
        { name: 'Priority', $type: 'SingleEnumIssueCustomField', value: { name: 'Minor' } },
      ],
    });
    expect(out).toEqual([
      { name: 'Assignee', $type: 'SingleUserIssueCustomField', value: { login: 'jane' } },
      { name: 'Priority', $type: 'SingleEnumIssueCustomField', value: { name: 'Minor' } },
    ]);
  });

  it('passes object values of typeless entries through unchanged, as main did', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: SCHEMA });
    const out = await customFieldsHelper.resolveCustomFields({
      loadFields,
      value: [
        { name: 'Priority', value: { id: '5-1' } },
        { name: 'Assignee', value: { id: '1-2' } },
        { name: 'Estimation', value: { minutes: 30 } },
      ],
    });
    expect(out).toEqual([
      { name: 'Priority', $type: 'SingleEnumIssueCustomField', value: { id: '5-1' } },
      { name: 'Assignee', $type: 'SingleUserIssueCustomField', value: { id: '1-2' } },
      { name: 'Estimation', $type: 'PeriodIssueCustomField', value: { minutes: 30 } },
    ]);
  });

  it('names the project fields when a field name is unknown', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: SCHEMA });
    await expect(customFieldsHelper.resolveCustomFields({ loadFields, value: { Severity: 'High' } }))
      .rejects.toThrow('The project has no custom field named "Severity". Its fields are: Priority, Labels, State');
  });

  it('accepts a JSON string and refuses a non-object', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: SCHEMA });
    expect(await customFieldsHelper.resolveCustomFields({ loadFields, value: '{"Priority":"Major"}' }))
      .toEqual([{ name: 'Priority', $type: 'SingleEnumIssueCustomField', value: { name: 'Major' } }]);
    await expect(customFieldsHelper.resolveCustomFields({ loadFields, value: 5 })).rejects.toThrow('must be an object');
  });
});

describe('non-admin fallbacks (live BUG-3)', () => {
  const issueRow = ({ name, id, type }: { name: string; id: string; type: string }) => ({
    name,
    $type: type,
    projectCustomField: { canBeEmpty: true, field: { name, fieldType: { id, isMultiValue: id.endsWith('[*]') } } },
  });

  it('reads field types from a sample issue when the admin endpoint returns []', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: [] });
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: '0-5', shortName: 'APT', name: 'AP' } });
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: [{ id: '3-1', customFields: [issueRow({ name: 'Priority', id: 'enum[1]', type: 'SingleEnumIssueCustomField' })] }] });
    const out = await customFieldsHelper.fieldsForProject({ auth: AUTH, projectId: '0-5', withValues: false });
    expect(out.source).toBe('sample issue');
    expect(out.fields.map((f) => [f.name, f.issueFieldType])).toEqual([['Priority', 'SingleEnumIssueCustomField']]);
    expect(sendRequest.mock.calls[2][0].url).toBe('https://x.youtrack.cloud/api/issues');
    expect(sendRequest.mock.calls[2][0].queryParams).toMatchObject({ query: 'project: {APT}', $top: '1' });
  });

  it('explains the missing admin right when the project has no issue either', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: [] });
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: '0-5', shortName: 'APT' } });
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: [] });
    await expect(customFieldsHelper.fieldsForProject({ auth: AUTH, projectId: '0-5', withValues: false }))
      .rejects.toThrow('cannot read the custom field settings of project APT (that needs project admin rights)');
  });

  it('fieldsFromIssue takes the $type from the issue itself', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { customFields: [issueRow({ name: 'Due Date', id: 'date', type: 'DateIssueCustomField' })] } });
    const fields = await customFieldsHelper.fieldsFromIssue({ auth: AUTH, issue: 'APT-5' });
    expect(sendRequest.mock.calls[0][0].url).toBe('https://x.youtrack.cloud/api/issues/APT-5');
    expect(fields[0]).toMatchObject({ name: 'Due Date', kind: 'date', issueFieldType: 'DateIssueCustomField' });
  });
});

describe('describeField', () => {
  it('reports allowed values, user logins, and truncation at 200', () => {
    const many = Array.from({ length: 250 }, (_, i) => ({ name: `v${i}` }));
    const parsed = customFieldsHelper.toProjectField({ canBeEmpty: true, field: { name: 'Big', fieldType: { id: 'enum[1]' } }, bundle: { values: many } });
    const users = customFieldsHelper.toProjectField({ canBeEmpty: false, field: { name: 'Assignee', fieldType: { id: 'user[1]' } }, bundle: { aggregatedUsers: [{ login: 'jane' }] } });
    if (parsed === null || users === null) throw new Error('no field');
    const big = customFieldsHelper.describeField(parsed);
    expect(big['allowedValues']).toHaveLength(200);
    expect(big['allowedValuesTruncated']).toBe(true);
    expect(big['required']).toBe(false);
    expect(customFieldsHelper.describeField(users)).toMatchObject({ allowedValues: ['jane'], required: true, issueFieldType: 'SingleUserIssueCustomField' });
  });
});
