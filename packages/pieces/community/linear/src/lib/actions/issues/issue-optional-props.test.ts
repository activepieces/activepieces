/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const createIssue = vi.fn();
const updateIssue = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    createIssue = createIssue;
    updateIssue = updateIssue;
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
  });

  test('create sends project, cycle, parent, due date and estimate when given', async () => {
    await linearCreateIssue.run(
      context({ team_id: 't1', title: 'T', project_id: 'p1', cycle_id: 'c1', parent_id: 'i0', due_date: '2026-10-15T00:00:00.000Z', estimate: 3 }),
    );
    expect(createIssue.mock.calls[0][0]).toMatchObject({ projectId: 'p1', cycleId: 'c1', parentId: 'i0', dueDate: '2026-10-15', estimate: 3 });
  });

  test('update without the new props sends none of them (today\'s behaviour)', async () => {
    await linearUpdateIssue.run(context({ team_id: 't1', issue_id: 'i1', title: 'New' }));
    const input = JSON.parse(JSON.stringify(updateIssue.mock.calls[0][1]));
    expect(input).toEqual({ title: 'New' });
  });
});
