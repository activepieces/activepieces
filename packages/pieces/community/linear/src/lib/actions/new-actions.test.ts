/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const rawRequest = vi.fn();
const issues = vi.fn();
const issueLabels = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    client = { rawRequest };
    issues = issues;
    issueLabels = issueLabels;
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
import { props as linearProps } from '../common/props';

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

function labelNodes({ from, count }: { from: number; count: number }) {
  return Array.from({ length: count }, (_, index) => ({ id: `label-${from + index}`, name: `L${from + index}` }));
}

function issueWithLabels({ id = UUID, count, hasNextPage }: { id?: string; count: number; hasNextPage: boolean }) {
  return {
    id,
    identifier: 'ENG-1',
    title: 'T',
    labels: { pageInfo: { hasNextPage, endCursor: hasNextPage ? 'labels-cursor-1' : null }, nodes: labelNodes({ from: 0, count }) },
  };
}

function labelsPage({ from, count }: { from: number; count: number }) {
  return { data: { issue: { labels: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: labelNodes({ from, count }) } } } };
}

describe('issue labels beyond the first 20', () => {
  beforeEach(() => {
    rawRequest.mockReset();
  });

  test('Get Issue reads the remaining label pages and returns every label', async () => {
    rawRequest
      .mockResolvedValueOnce({ data: { issue: issueWithLabels({ count: 20, hasNextPage: true }) } })
      .mockResolvedValueOnce(labelsPage({ from: 20, count: 7 }));
    const result = toRecord(await linearGetIssue.run(context({ issue_id: 'ENG-1' })));
    expect(result['label_ids']).toHaveLength(27);
    expect(result['label_ids']).toContain('label-26');
    expect(rawRequest.mock.calls[0][0]).toContain('labels(first: 20)');
    expect(rawRequest.mock.calls[1][0]).toContain('LinearIssueLabelsPage');
    expect(rawRequest.mock.calls[1][1]).toEqual({ id: UUID, after: 'labels-cursor-1' });
  });

  test('Get Issue makes no extra request when every label fits in the first page', async () => {
    rawRequest.mockResolvedValueOnce({ data: { issue: issueWithLabels({ count: 3, hasNextPage: false }) } });
    const result = toRecord(await linearGetIssue.run(context({ issue_id: 'ENG-1' })));
    expect(result['label_ids']).toHaveLength(3);
    expect(rawRequest).toHaveBeenCalledTimes(1);
  });

  test('Search Issues completes the labels of each issue that has more than 20', async () => {
    rawRequest
      .mockResolvedValueOnce({
        data: {
          searchIssues: {
            totalCount: 2,
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [issueWithLabels({ id: 'issue-a', count: 20, hasNextPage: true }), issueWithLabels({ id: 'issue-b', count: 2, hasNextPage: false })],
          },
        },
      })
      .mockResolvedValueOnce(labelsPage({ from: 20, count: 10 }));
    const result = toRecord(await linearSearchIssues.run(context({ term: 'x' })));
    const items = result['items'];
    expect(Array.isArray(items) ? items.map((item) => toRecord(item)['label_ids']) : []).toEqual([
      labelNodes({ from: 0, count: 30 }).map((label) => label.id),
      ['label-0', 'label-1'],
    ]);
    expect(rawRequest.mock.calls[1][1]).toEqual({ id: 'issue-a', after: 'labels-cursor-1' });
  });

  test('Add Label and Remove Label return every label of the issue', async () => {
    rawRequest
      .mockResolvedValueOnce({ data: { issueAddLabel: { success: true, issue: issueWithLabels({ count: 20, hasNextPage: true }) } } })
      .mockResolvedValueOnce(labelsPage({ from: 20, count: 1 }));
    const added = toRecord(await linearAddLabelToIssue.run(context({ team_id: UUID, issue_id: UUID, label_id: 'label-20' })));
    expect(added['label_ids']).toHaveLength(21);
    rawRequest
      .mockResolvedValueOnce({ data: { issueRemoveLabel: { success: true, issue: issueWithLabels({ count: 20, hasNextPage: true }) } } })
      .mockResolvedValueOnce(labelsPage({ from: 20, count: 4 }));
    const removed = toRecord(await linearRemoveLabelFromIssue.run(context({ team_id: UUID, issue_id: UUID, label_id: 'label-99' })));
    expect(removed['label_ids']).toHaveLength(24);
  });

  test('Add Label succeeds with labels_complete false when the follow-up label read fails', async () => {
    rawRequest
      .mockResolvedValueOnce({ data: { issueAddLabel: { success: true, issue: issueWithLabels({ count: 20, hasNextPage: true }) } } })
      .mockRejectedValueOnce(new Error('network down'));
    const added = toRecord(await linearAddLabelToIssue.run(context({ team_id: UUID, issue_id: UUID, label_id: 'label-20' })));
    expect(added['label_ids']).toHaveLength(20);
    expect(added['labels_complete']).toBe(false);
  });

  test('labels_complete is true when every label page was read, and when the first page had them all', async () => {
    rawRequest
      .mockResolvedValueOnce({ data: { issue: issueWithLabels({ count: 20, hasNextPage: true }) } })
      .mockResolvedValueOnce(labelsPage({ from: 20, count: 2 }));
    expect(toRecord(await linearGetIssue.run(context({ issue_id: 'ENG-1' })))['labels_complete']).toBe(true);
    rawRequest.mockReset();
    rawRequest.mockResolvedValueOnce({ data: { issue: issueWithLabels({ count: 3, hasNextPage: false }) } });
    expect(toRecord(await linearGetIssue.run(context({ issue_id: 'ENG-1' })))['labels_complete']).toBe(true);
    expect(rawRequest).toHaveBeenCalledTimes(1);
  });

  test('Search Issues reads the label pages of several issues at once and marks only the failed one incomplete', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    rawRequest.mockImplementation(async (query: string, variables: Record<string, unknown>) => {
      if (!query.includes('LinearIssueLabelsPage')) {
        return {
          data: {
            searchIssues: {
              totalCount: 3,
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: ['issue-a', 'issue-b', 'issue-c'].map((id) => issueWithLabels({ id, count: 20, hasNextPage: true })),
            },
          },
        };
      }
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight -= 1;
      if (variables['id'] === 'issue-b') {
        throw new Error('network down');
      }
      return labelsPage({ from: 20, count: 5 });
    });
    const result = toRecord(await linearSearchIssues.run(context({ term: 'x' })));
    const items = Array.isArray(result['items']) ? result['items'].map((item) => toRecord(item)) : [];
    expect(maxInFlight).toBe(3);
    expect(items.map((item) => item['labels_complete'])).toEqual([true, false, true]);
    expect(items.map((item) => Array.isArray(item['label_ids']) ? item['label_ids'].length : 0)).toEqual([25, 20, 25]);
  });
});

describe('issue field of Add Label, Remove Label, Delete Issue and Attach Link', () => {
  beforeEach(() => {
    rawRequest.mockReset();
  });

  const actions = [
    { action: linearAddLabelToIssue, props: { team_id: UUID, label_id: 'label-1' }, mutation: 'issueAddLabel' },
    { action: linearRemoveLabelFromIssue, props: { team_id: UUID, label_id: 'label-1' }, mutation: 'issueRemoveLabel' },
    { action: linearDeleteIssue, props: {}, mutation: 'issueDelete' },
    { action: linearAttachLink, props: { url: 'https://github.com/a/b/pull/1', title: 'PR 1' }, mutation: 'attachmentCreate' },
  ];

  test.each(actions)('$action.name takes any issue as text under the issue_id key', ({ action }) => {
    expect(action.props['issue_id']).toMatchObject({ type: 'SHORT_TEXT', required: true });
  });

  test.each(actions)('$action.name resolves an identifier like eng-7 to the issue UUID', async ({ action, props, mutation }) => {
    rawRequest.mockImplementation(async (query: string) => {
      if (query.includes('LinearIssueIdLookup')) return { data: { issue: { id: UUID } } };
      return { data: populated() };
    });
    await action.run(context({ ...props, issue_id: ' eng-7 ' }));
    expect(rawRequest.mock.calls[0][1]).toEqual({ id: 'ENG-7' });
    const mutationCall = rawRequest.mock.calls.find(([query]) => String(query).includes(mutation));
    expect(JSON.stringify(mutationCall?.[1])).toContain(UUID);
  });

  test.each(actions)('$action.name reports an unknown identifier', async ({ action, props }) => {
    rawRequest.mockResolvedValue({ data: { issue: null } });
    await expect(action.run(context({ ...props, issue_id: 'ENG-404' }))).rejects.toThrow('No Linear issue found for ENG-404');
    expect(rawRequest).toHaveBeenCalledTimes(1);
  });

  test('Delete Issue and Attach Link no longer ask for a team', () => {
    expect(linearDeleteIssue.props).not.toHaveProperty('team_id');
    expect(linearAttachLink.props).not.toHaveProperty('team_id');
  });
});

describe('Label and Cycle dropdowns', () => {
  beforeEach(() => {
    rawRequest.mockReset();
    issueLabels.mockReset();
  });

  test('Label dropdown lists team labels, then workspace labels', async () => {
    issueLabels
      .mockResolvedValueOnce({ nodes: [{ id: 'l2', name: 'Bug' }], pageInfo: { hasNextPage: false } })
      .mockResolvedValueOnce({ nodes: [{ id: 'l1', name: 'Security' }], pageInfo: { hasNextPage: false } });
    const result = await linearProps.label_id().options({ auth, team_id: UUID }, createMockActionContext({}));
    expect(result).toEqual({
      disabled: false,
      options: [
        { label: 'Bug', value: 'l2' },
        { label: '[Workspace] Security', value: 'l1' },
      ],
    });
  });

  test('Label dropdown shows why it could not load instead of throwing', async () => {
    issueLabels.mockRejectedValue(new Error('network down'));
    const result = await linearProps.label_id().options({ auth, team_id: UUID }, createMockActionContext({}));
    expect(result).toEqual({ disabled: true, placeholder: 'Could not load labels: network down', options: [] });
  });

  test('Cycle dropdown asks Linear only for current and upcoming cycles', async () => {
    rawRequest.mockResolvedValue({
      data: {
        cycles: {
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [
            { id: 'c1', number: 4, name: null, startsAt: '2026-09-27T00:00:00.000Z', isActive: true, isNext: false, isPast: false },
            { id: 'c2', number: 5, name: 'Polish', startsAt: '2026-10-04T00:00:00.000Z', isActive: false, isNext: true, isPast: false },
          ],
        },
      },
    });
    const result = await linearProps.cycle_id().options({ auth, team_id: UUID }, createMockActionContext({}));
    expect(rawRequest.mock.calls[0][1]).toMatchObject({ filter: { team: { id: { eq: UUID } }, isPast: { eq: false } } });
    expect(result).toMatchObject({
      disabled: false,
      options: [
        { label: 'Cycle 4 · starts 2026-09-27 (current)', value: 'c1' },
        { label: 'Cycle 5 Polish · starts 2026-10-04 (next)', value: 'c2' },
      ],
    });
  });
});

describe('Team and Label fields of Add Label and Remove Label', () => {
  beforeEach(() => {
    rawRequest.mockReset();
  });

  const labelActions = [linearAddLabelToIssue, linearRemoveLabelFromIssue];

  test.each(labelActions)('$name explains which team to pick', (action) => {
    expect(action.props['team_id']).toMatchObject({
      required: true,
      description: "Team whose labels are listed. Pick the issue's team; workspace labels work on any issue.",
    });
  });

  test('other actions keep the shared Team description', () => {
    expect(linearCreateIssue.props['team_id']).toMatchObject({ description: 'The team for which the issue, project or comment will be created' });
  });

  test.each(labelActions)('$name asks for a label before looking up the issue', async (action) => {
    await expect(action.run(context({ team_id: UUID, issue_id: 'ENG-7', label_id: '' }))).rejects.toThrow('Select a label.');
    expect(rawRequest).not.toHaveBeenCalled();
  });
});
