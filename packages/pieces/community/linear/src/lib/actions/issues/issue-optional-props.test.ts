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

  test('parent issue also accepts the exact title, searched within the team', async () => {
    linearRoutes({
      titlePages: [[{ id: 'other', identifier: 'ENG-2', title: 'Checkout redesign v2' }, { id: 'wanted', identifier: 'ENG-1', title: 'Checkout redesign' }]],
    });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: '  checkout REDESIGN ' }));
    expect(variablesOf('LinearParentTitleSearch')).toMatchObject({ term: 'checkout REDESIGN', filter: { team: { id: { eq: 't1' } } } });
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'wanted' });
  });

  test('the title search reads every page, so a match on a later page is found', async () => {
    const filler = Array.from({ length: 100 }, (_, i) => ({ id: `f${i}`, identifier: `ENG-${1000 + i}`, title: `Release notes ${i}` }));
    linearRoutes({ titlePages: [filler, [{ id: 'late', identifier: 'ENG-9', title: 'Release notes' }]] });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'Release notes' }));
    expect(callsOf('LinearParentTitleSearch')).toHaveLength(2);
    expect(callsOf('LinearParentTitleSearch')[1]).toMatchObject({ after: 'cursor-1' });
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'late' });
  });

  test('two issues with the same title on different pages are refused as ambiguous', async () => {
    linearRoutes({ titlePages: [[{ id: 'a', identifier: 'ENG-4', title: 'Bug' }], [{ id: 'b', identifier: 'ENG-5', title: 'bug' }]] });
    await expect(linearUpdateIssue.run(context({ team_id: 't1', issue_id: 'i1', parent_id: 'Bug' }))).rejects.toThrow(
      '"Bug" matches 2 issues: ENG-4 (title), ENG-5 (title). Use the ID of the one you mean.',
    );
    expect(updateIssue).not.toHaveBeenCalled();
  });

  test('an identifier-shaped title is found by title when no issue has that identifier', async () => {
    linearRoutes({ titlePages: [[{ id: 'titled', identifier: 'OPS-3', title: 'ENG-12' }]] });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-12' }));
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'titled' });
  });

  test('an identifier that is also another issue title is refused instead of guessed', async () => {
    linearRoutes({ identifiers: { 'ENG-12': 'by-identifier' }, titlePages: [[{ id: 'titled', identifier: 'OPS-3', title: 'ENG-12' }]] });
    await expect(linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-12' }))).rejects.toThrow(
      '"ENG-12" matches 2 issues: ENG-12 (identifier), OPS-3 (title). Use the ID of the one you mean.',
    );
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('the same issue matching by identifier and by title is not ambiguous', async () => {
    linearRoutes({ identifiers: { 'ENG-12': 'same' }, titlePages: [[{ id: 'same', identifier: 'ENG-12', title: 'ENG-12' }]] });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-12' }));
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'same' });
  });

  test('a valid identifier still works when the title search fails or hits its cap', async () => {
    linearRoutes({ identifiers: { 'ENG-7': 'by-identifier' }, titleError: new Error('Rate limit exceeded') });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-7' }));
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'by-identifier' });
    const page = [{ id: 'x', identifier: 'ENG-1', title: 'other' }];
    linearRoutes({ identifiers: { 'ENG-8': 'capped-identifier' }, titlePages: Array.from({ length: 11 }, () => page) });
    await linearUpdateIssue.run(context({ team_id: 't1', issue_id: 'i1', parent_id: 'ENG-8' }));
    expect(updateIssue.mock.calls[0][1]).toMatchObject({ parentId: 'capped-identifier' });
  });

  test('a failed title search is reported when there is no identifier match', async () => {
    linearRoutes({ titleError: new Error('Rate limit exceeded') });
    await expect(linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'Checkout redesign' }))).rejects.toThrow(
      'Rate limit exceeded',
    );
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('stops after 10 pages with a clear message instead of guessing', async () => {
    const page = [{ id: 'x', identifier: 'ENG-1', title: 'other' }];
    linearRoutes({ titlePages: Array.from({ length: 11 }, () => page) });
    await expect(linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'Common words' }))).rejects.toThrow(
      'Too many issues match "Common words" to check them all.',
    );
    expect(callsOf('LinearParentTitleSearch')).toHaveLength(10);
  });
});

function linearRoutes({ identifiers = {}, titlePages = [[]], titleError }: LinearRoutes) {
  let page = 0;
  rawRequest.mockImplementation(async (query: string, variables: Record<string, unknown>) => {
    if (query.includes('LinearIssueIdLookup')) {
      const id = identifiers[String(variables['id'])];
      return { data: { issue: id ? { id } : null } };
    }
    if (query.includes('LinearParentTitleSearch')) {
      if (titleError) {
        throw titleError;
      }
      const nodes = titlePages[page] ?? [];
      page++;
      const hasNextPage = page < titlePages.length;
      return { data: { searchIssues: { pageInfo: { hasNextPage, endCursor: hasNextPage ? `cursor-${page}` : null }, nodes } } };
    }
    throw new Error(`unexpected query ${query}`);
  });
}

function callsOf(name: string): Record<string, unknown>[] {
  return rawRequest.mock.calls.filter((call) => String(call[0]).includes(name)).map((call) => call[1]);
}

function variablesOf(name: string): Record<string, unknown> {
  return callsOf(name)[0];
}

type LinearRoutes = {
  identifiers?: Record<string, string>;
  titlePages?: Array<Array<{ id: string; identifier: string; title: string }>>;
  titleError?: Error;
};
