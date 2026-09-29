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
    rawRequest.mockResolvedValue({ data: { issue: { id: 'parent-uuid' } } });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: ' eng-7 ' }));
    expect(rawRequest.mock.calls[0][1]).toMatchObject({ id: 'ENG-7' });
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
    rawRequest.mockResolvedValue({ data: { issue: null } });
    await expect(linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'ENG-404' }))).rejects.toThrow(
      'No Linear issue found for ENG-404.',
    );
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('parent issue also accepts the exact title, searched within the team', async () => {
    rawRequest.mockResolvedValue({
      data: {
        searchIssues: {
          nodes: [
            { id: 'other', identifier: 'ENG-2', title: 'Checkout redesign v2' },
            { id: 'wanted', identifier: 'ENG-1', title: 'Checkout redesign' },
          ],
        },
      },
    });
    await linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: '  checkout REDESIGN ' }));
    expect(rawRequest.mock.calls[0][0]).toContain('LinearParentTitleSearch');
    expect(rawRequest.mock.calls[0][1]).toMatchObject({ term: 'checkout REDESIGN', filter: { team: { id: { eq: 't1' } } } });
    expect(createIssue.mock.calls[0][0]).toMatchObject({ parentId: 'wanted' });
  });

  test('a title with no exact match, or with several, is refused before the issue is created', async () => {
    rawRequest.mockResolvedValueOnce({ data: { searchIssues: { nodes: [{ id: 'x', identifier: 'ENG-3', title: 'Checkout redesign v2' }] } } });
    await expect(linearCreateIssue.run(context({ team_id: 't1', title: 'Child', parent_id: 'Checkout redesign' }))).rejects.toThrow(
      'No issue titled "Checkout redesign" was found in this team. Use its identifier (for example ENG-123) or ID.',
    );
    rawRequest.mockResolvedValueOnce({
      data: { searchIssues: { nodes: [{ id: 'a', identifier: 'ENG-4', title: 'Bug' }, { id: 'b', identifier: 'ENG-5', title: 'bug' }] } },
    });
    await expect(linearUpdateIssue.run(context({ team_id: 't1', issue_id: 'i1', parent_id: 'Bug' }))).rejects.toThrow(
      '2 issues are titled "Bug": ENG-4, ENG-5. Use the identifier of the one you mean.',
    );
    expect(createIssue).not.toHaveBeenCalled();
    expect(updateIssue).not.toHaveBeenCalled();
  });
});
