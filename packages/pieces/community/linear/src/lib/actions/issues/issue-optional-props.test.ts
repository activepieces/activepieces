/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const createIssue = vi.fn();
const updateIssue = vi.fn();
const rawRequest = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    createIssue = createIssue;
    updateIssue = updateIssue;
    client = { rawRequest };
  },
  LinearDocument: {},
}));

import '../../../index';
import { linearCreateIssue } from './create-issue';
import { linearUpdateIssue } from './update-issue';

const auth = { type: 'SECRET_TEXT', secret_text: 'lin_api_test' };
const ok = { success: true, lastSyncId: 1, issue: Promise.resolve({ id: 'i1' }) };

function context(propsValue: Record<string, unknown>) {
  return { ...createMockActionContext({ propsValue }), auth };
}

describe('new optional issue props', () => {
  beforeEach(() => {
    createIssue.mockReset().mockResolvedValue(ok);
    updateIssue.mockReset().mockResolvedValue(ok);
    rawRequest.mockReset();
  });

  test('create sends project, cycle, parent, due date and estimate when given', async () => {
    await linearCreateIssue.run(
      context({ team_id: 't1', title: 'T', project_id: 'p1', cycle_id: 'c1', parent_id: '3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b', due_date: '2026-10-15T00:00:00.000Z', estimate: 3 }),
    );
    expect(createIssue.mock.calls[0][0]).toMatchObject({ projectId: 'p1', cycleId: 'c1', parentId: '3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b', dueDate: '2026-10-15', estimate: 3 });
  });

  test('update without the new props sends none of them (today\'s behaviour)', async () => {
    await linearUpdateIssue.run(context({ team_id: 't1', issue_id: 'i1', title: 'New' }));
    const input = JSON.parse(JSON.stringify(updateIssue.mock.calls[0][1]));
    expect(input).toEqual({ title: 'New' });
  });

  test('parent issue accepts an identifier and resolves it to the issue id', async () => {
    linearRoutes({ identifiers: { 'ENG-7': 'parent-uuid' } });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: ' eng-7 ' }));
    expect(variablesOf('LinearIssueIdLookup')).toMatchObject({ id: 'ENG-7' });
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'parent-uuid' });
  });

  test('parent issue passes a UUID through without a lookup, on create and update', async () => {
    const uuid = '0b6d0a4c-2f0e-4a51-9d8e-4a2b1d1c9f00';
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: uuid }));
    await linearUpdateIssue.run(context({ team_id: 't1', issue_id: 'i1', parent_id: uuid }));
    expect(rawRequest).not.toHaveBeenCalled();
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: uuid });
    expect(updateIssue.mock.calls[0][1]).toMatchObject({ parentId: uuid });
  });

  test('an unknown parent fails before the issue is created', async () => {
    linearRoutes({});
    await expect(linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-404' }))).rejects.toThrow(
      'No issue with the identifier or exact title "ENG-404" was found in this team. Use its identifier (for example ENG-123) or ID.',
    );
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('parent issue also accepts the exact title, looked up with an exact filter in the team', async () => {
    linearRoutes({
      titles: [
        { id: 'other', identifier: 'ENG-2', title: 'Checkout redesign v2' },
        { id: 'wanted', identifier: 'ENG-1', title: 'Checkout redesign' },
      ],
    });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: '  checkout REDESIGN ' }));
    expect(callsOf('LinearParentTitleLookup')).toHaveLength(1);
    expect(variablesOf('LinearParentTitleLookup')).toEqual({
      first: 2,
      filter: { title: { eqIgnoreCase: 'checkout REDESIGN' }, team: { id: { eq: 't1' } } },
    });
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'wanted' });
  });

  test('two issues with the same title are refused as ambiguous', async () => {
    linearRoutes({ titles: [{ id: 'a', identifier: 'ENG-4', title: 'Bug' }, { id: 'b', identifier: 'ENG-5', title: 'bug' }, { id: 'c', identifier: 'ENG-6', title: 'BUG' }] });
    await expect(linearUpdateIssue.run(context({ team_id: 't1', issue_id: 'i1', parent_id: 'Bug' }))).rejects.toThrow(
      '"Bug" matches more than one issue: ENG-4 (title), ENG-5 (title). Use the ID of the one you mean.',
    );
    expect(updateIssue).not.toHaveBeenCalled();
  });

  test('an identifier-shaped title is found by title when no issue has that identifier', async () => {
    linearRoutes({ titles: [{ id: 'titled', identifier: 'OPS-3', title: 'ENG-12' }] });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-12' }));
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'titled' });
  });

  test('an identifier that is also another issue title is refused instead of guessed', async () => {
    linearRoutes({ identifiers: { 'ENG-12': 'by-identifier' }, titles: [{ id: 'titled', identifier: 'OPS-3', title: 'ENG-12' }] });
    await expect(linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-12' }))).rejects.toThrow(
      '"ENG-12" matches more than one issue: ENG-12 (identifier), OPS-3 (title). Use the ID of the one you mean.',
    );
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('the same issue matching by identifier and by title is not ambiguous', async () => {
    linearRoutes({ identifiers: { 'ENG-12': 'same' }, titles: [{ id: 'same', identifier: 'ENG-12', title: 'ENG-12' }] });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-12' }));
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'same' });
  });

  test('a valid identifier still works when the title lookup fails', async () => {
    linearRoutes({ identifiers: { 'ENG-7': 'by-identifier' }, titleError: new Error('Rate limit exceeded') });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-7' }));
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'by-identifier' });
  });

  test('a failed title lookup is reported when there is no identifier match', async () => {
    linearRoutes({ titleError: new Error('Rate limit exceeded') });
    await expect(linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'Checkout redesign' }))).rejects.toThrow(
      'Rate limit exceeded',
    );
    expect(createIssue).not.toHaveBeenCalled();
  });
});

function linearRoutes({ identifiers = {}, titles = [], titleError }: LinearRoutes) {
  rawRequest.mockImplementation(async (query: string, variables: Record<string, unknown>) => {
    if (query.includes('LinearIssueIdLookup')) {
      const id = identifiers[String(variables['id'])];
      return { data: { issue: id ? { id } : null } };
    }
    if (query.includes('LinearParentTitleLookup')) {
      if (titleError) {
        throw titleError;
      }
      const filter = variables['filter'];
      const wanted = isRecord(filter) && isRecord(filter['title']) ? String(filter['title']['eqIgnoreCase']).toLowerCase() : '';
      const nodes = titles.filter((issue) => issue.title.toLowerCase() === wanted).slice(0, Number(variables['first']));
      return { data: { issues: { nodes } } };
    }
    throw new Error(`unexpected query ${query}`);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function callsOf(name: string): Record<string, unknown>[] {
  return rawRequest.mock.calls.filter((call) => String(call[0]).includes(name)).map((call) => call[1]);
}

function variablesOf(name: string): Record<string, unknown> {
  return callsOf(name)[0];
}

type LinearRoutes = {
  identifiers?: Record<string, string>;
  titles?: Array<{ id: string; identifier: string; title: string }>;
  titleError?: Error;
};
