/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const rawRequest = vi.fn();
const issues = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    client = { rawRequest };
    issues = issues;
  },
  LinearDocument: { PaginationOrderBy: { UpdatedAt: 'updatedAt' } },
}));

import '../../index';
import { linearGetIssue } from './issues/get-issue';
import { linearSearchIssues } from './issues/search-issues';
import { linearAddLabelToIssue } from './issues/add-label-to-issue';
import { linearRemoveLabelFromIssue } from './issues/remove-label-from-issue';
import { linearDeleteIssue } from './issues/delete-issue';
import { linearAttachLink } from './attachments/attach-link';
import { linearCreateProjectStatusUpdate } from './projects/create-project-status-update';
import { linearCreateIssue } from './issues/create-issue';
import { linearUpdateIssue } from './issues/update-issue';

const auth = { type: 'SECRET_TEXT', secret_text: 'lin_api_test' };
const UUID = '0b6d0a4c-2f0e-4a51-9d8e-4a2b1d1c9f00';

function context(propsValue: Record<string, unknown>) {
  return { ...createMockActionContext({ propsValue }), auth };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('expected an object');
  }
  return Object.fromEntries(Object.entries(value));
}

function populated(): unknown {
  const base: Record<string, unknown> = { success: true, id: UUID, totalCount: 1, pageInfo: { hasNextPage: false, endCursor: null } };
  const proxy: unknown = new Proxy(base, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON') return undefined;
      if (prop === 'nodes') return [proxy];
      if (prop in target) return target[prop];
      return proxy;
    },
  });
  return proxy;
}

function keys(fields: Array<{ key: string; value?: string }>): string[] {
  return fields.map((field) => field.value ?? field.key).sort();
}

const cases = [
  { action: linearGetIssue, props: { issue_id: 'ENG-1' } },
  { action: linearSearchIssues, props: { term: 'login', team_id: UUID, limit: 5 } },
  { action: linearAddLabelToIssue, props: { team_id: UUID, issue_id: UUID, label_id: UUID } },
  { action: linearRemoveLabelFromIssue, props: { team_id: UUID, issue_id: UUID, label_id: UUID } },
  { action: linearDeleteIssue, props: { team_id: UUID, issue_id: UUID } },
  { action: linearAttachLink, props: { team_id: UUID, issue_id: UUID, url: 'https://github.com/a/b/pull/1', title: 'PR 1' } },
  { action: linearCreateProjectStatusUpdate, props: { team_id: UUID, project_id: UUID, body: 'On track', health: 'onTrack' } },
];

describe('PR-A actions', () => {
  beforeEach(() => {
    rawRequest.mockReset();
    rawRequest.mockImplementation(async () => ({ data: populated() }));
  });

  test.each(cases)('$action.name output matches its outputSchema', async ({ action, props }) => {
    const result = toRecord(await action.run(context(props)));
    const fields = action.outputSchema?.fields ?? [];
    expect(Object.keys(result).sort()).toEqual(keys(fields));
    const itemsField = fields.find((field) => field.key === 'items');
    const items = result['items'];
    if (itemsField?.listItems && Array.isArray(items)) {
      expect(Object.keys(items[0]).sort()).toEqual(keys(itemsField.listItems));
    }
  });

  test('search filters by team through filter, and delete never sends permanentlyDelete', async () => {
    await linearSearchIssues.run(context({ term: 'x', team_id: UUID }));
    expect(rawRequest.mock.calls[0][1]).toMatchObject({ filter: { team: { id: { eq: UUID } } } });
    expect(rawRequest.mock.calls[0][1]).not.toHaveProperty('teamId');
    rawRequest.mockClear();
    await linearDeleteIssue.run(context({ team_id: UUID, issue_id: UUID }));
    expect(rawRequest.mock.calls[0][0]).not.toContain('permanentlyDelete');
  });

  test('search passes the cursor as after, and sends no after when it is empty', async () => {
    await linearSearchIssues.run(context({ term: 'x', cursor: ' cursor-1 ' }));
    expect(rawRequest.mock.calls[0][1]).toMatchObject({ after: 'cursor-1' });
    rawRequest.mockClear();
    await linearSearchIssues.run(context({ term: 'x' }));
    expect(rawRequest.mock.calls[0][1].after).toBeUndefined();
    rawRequest.mockClear();
    await linearSearchIssues.run(context({ term: 'x', cursor: '' }));
    expect(rawRequest.mock.calls[0][1].after).toBeUndefined();
  });

  test('attach link refuses a non-http url before any request', async () => {
    await expect(
      linearAttachLink.run(context({ team_id: UUID, issue_id: UUID, url: 'javascript:alert(1)', title: 'x' })),
    ).rejects.toThrow('http');
    expect(rawRequest).not.toHaveBeenCalled();
  });
});

describe('Parent Issue', () => {
  beforeEach(() => {
    rawRequest.mockReset();
  });

  test('is a text field, so the saved value is always shown and nothing is fetched while typing', () => {
    expect(linearCreateIssue.props['parent_id']).toMatchObject({ type: 'SHORT_TEXT', required: false });
    expect(linearUpdateIssue.props['parent_id']).toMatchObject({ type: 'SHORT_TEXT', required: false });
  });
});
