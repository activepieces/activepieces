/// <reference types="vitest/globals" />

import { writeFileSync } from 'node:fs';
import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const rawRequest = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    client = { rawRequest };
  },
  LinearDocument: {},
}));

import '../../../index';
import { linearAtomics } from './index';
import { assertLinearUploadUrl } from './upload-download';

const auth = { type: 'SECRET_TEXT', secret_text: 'lin_api_test' };
const UUID = '0b6d0a4c-2f0e-4a51-9d8e-4a2b1d1c9f00';
const UUID2 = '1c7e1b5d-3a1f-4b62-8e9f-5b3c2e2d0a11';

function universal(): unknown {
  const base: Record<string, unknown> = {
    success: true,
    id: UUID,
    entityId: UUID,
    totalCount: 0,
    nodes: [],
    pageInfo: { hasNextPage: false, endCursor: null },
  };
  const proxy: unknown = new Proxy(base, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON') return undefined;
      if (prop in target) return target[prop];
      return proxy;
    },
  });
  return proxy;
}

function populated(): unknown {
  const base: Record<string, unknown> = {
    success: true,
    id: UUID,
    entityId: UUID,
    totalCount: 1,
    pageInfo: { hasNextPage: false, endCursor: null },
  };
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

function schemaKeys(fields: Array<{ key: string; value?: string }>): string[] {
  return fields.map((field) => field.value ?? field.key).sort();
}

function action(name: string) {
  const found = linearAtomics.find((a) => a.name === name);
  if (!found) throw new Error(`missing atomic ${name}`);
  return found;
}

async function run({ name, propsValue }: { name: string; propsValue: Record<string, unknown> }) {
  return action(name).run({
    ...createMockActionContext({ propsValue }),
    auth,
    files: { write: vi.fn().mockResolvedValue('file://x') },
  });
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('expected an object');
  }
  return Object.fromEntries(Object.entries(value));
}

function lastCall(): { query: string; variables: Record<string, unknown> } {
  const call = rawRequest.mock.calls[rawRequest.mock.calls.length - 1];
  return { query: call[0], variables: call[1] };
}

describe('linear atomics', () => {
  beforeEach(() => {
    rawRequest.mockReset();
    rawRequest.mockImplementation(async () => ({ data: universal() }));
  });

  test('there are 44 atomics, all audience ai with a unique linear_ name', () => {
    expect(linearAtomics).toHaveLength(44);
    expect(new Set(linearAtomics.map((a) => a.name)).size).toBe(44);
    for (const a of linearAtomics) {
      expect(a.audience).toBe('ai');
      expect(a.name.startsWith('linear_')).toBe(true);
    }
  });

  describe('linear_issue_update is a true partial update', () => {
    test('sends only the fields that were given', async () => {
      await run({ name: 'linear_issue_update', propsValue: { issue_id: UUID, title: 'New title' } });
      expect(lastCall().variables).toEqual({ id: UUID, input: { title: 'New title' } });
    });

    test('empty strings, empty arrays and unset values are not sent', async () => {
      await run({ name: 'linear_issue_update', propsValue: {
        issue_id: UUID,
        priority: 2,
        description: '',
        assignee_id: undefined,
        label_ids: [],
        add_label_ids: [],
      } });
      expect(lastCall().variables['input']).toEqual({ priority: 2 });
    });

    test('priority 0 (none) is sent, not dropped as falsy', async () => {
      await run({ name: 'linear_issue_update', propsValue: { issue_id: UUID, priority: 0 } });
      expect(lastCall().variables['input']).toEqual({ priority: 0 });
    });

    test('incremental labels use addedLabelIds / removedLabelIds', async () => {
      await run({ name: 'linear_issue_update', propsValue: { issue_id: UUID, add_label_ids: ['l1'], remove_label_ids: ['l2'] } });
      expect(lastCall().variables['input']).toEqual({ addedLabelIds: ['l1'], removedLabelIds: ['l2'] });
    });

    test('clear_fields sends null, and [] for labels', async () => {
      await run({ name: 'linear_issue_update', propsValue: { issue_id: UUID, clear_fields: ['assigneeId', 'dueDate', 'labelIds'] } });
      expect(lastCall().variables['input']).toEqual({ assigneeId: null, dueDate: null, labelIds: [] });
    });

    test('refuses set and clear on the same field, replace plus incremental labels, and an empty update', async () => {
      await expect(run({ name: 'linear_issue_update', propsValue: { issue_id: UUID, assignee_id: UUID2, clear_fields: ['assigneeId'] } })).rejects.toThrow('both set and cleared');
      await expect(run({ name: 'linear_issue_update', propsValue: { issue_id: UUID, label_ids: ['a'], add_label_ids: ['b'] } })).rejects.toThrow('not both');
      await expect(run({ name: 'linear_issue_update', propsValue: { issue_id: UUID } })).rejects.toThrow('Nothing to update');
    });

    test('an identifier is resolved to the UUID first', async () => {
      await run({ name: 'linear_issue_update', propsValue: { issue_id: 'ENG-7', title: 'x' } });
      expect(rawRequest.mock.calls[0][1]).toEqual({ id: 'ENG-7' });
      expect(lastCall().variables['id']).toBe(UUID);
    });
  });

  describe('linear_project_update never clobbers teams', () => {
    test('teamIds is not sent unless given', async () => {
      await run({ name: 'linear_project_update', propsValue: { project_id: UUID, name: 'Renamed' } });
      expect(lastCall().variables).toEqual({ id: UUID, input: { name: 'Renamed' } });
    });

    test('teamIds replaces only when given', async () => {
      await run({ name: 'linear_project_update', propsValue: { project_id: UUID, team_ids: ['t1', 't2'] } });
      expect(lastCall().variables['input']).toEqual({ teamIds: ['t1', 't2'] });
    });

    test('clear_fields sends null for dates and lead', async () => {
      await run({ name: 'linear_project_update', propsValue: { project_id: UUID, clear_fields: ['leadId', 'targetDate'] } });
      expect(lastCall().variables['input']).toEqual({ leadId: null, targetDate: null });
    });
  });

  describe('linear_team_update tri-state booleans', () => {
    test('an unset toggle is not sent and "false" is sent as false', async () => {
      await run({ name: 'linear_team_update', propsValue: { team_id: UUID, cycles_enabled: 'false' } });
      expect(lastCall().variables['input']).toEqual({ cyclesEnabled: false });
    });
  });

  describe('linear_issue_label_create get-or-create', () => {
    test('returns the existing label with created false and does not create', async () => {
      rawRequest.mockResolvedValueOnce({
        data: { issueLabels: { nodes: [{ id: 'lab-1', name: 'Bug', color: '#EB5757', isGroup: false, createdAt: 'x' }], pageInfo: { hasNextPage: false } } },
      });
      const result = await run({ name: 'linear_issue_label_create', propsValue: { name: 'bug', team_id: UUID } });
      expect(result).toMatchObject({ created: false, id: 'lab-1' });
      expect(rawRequest).toHaveBeenCalledTimes(1);
      expect(rawRequest.mock.calls[0][1]).toMatchObject({
        filter: { name: { eqIgnoreCase: 'bug' }, or: [{ team: { id: { eq: UUID } } }, { team: { null: true } }] },
      });
    });

    test('with a team, finds a workspace label of that name instead of creating a team copy', async () => {
      rawRequest.mockResolvedValueOnce({
        data: { issueLabels: { nodes: [{ id: 'lab-ws', name: 'Security', color: '#000000', isGroup: false, createdAt: 'x', team: null }], pageInfo: { hasNextPage: false } } },
      });
      const result = await run({ name: 'linear_issue_label_create', propsValue: { name: 'security', team_id: UUID } });
      expect(result).toMatchObject({ created: false, id: 'lab-ws' });
      expect(rawRequest).toHaveBeenCalledTimes(1);
      expect(rawRequest.mock.calls[0][1]['filter']).not.toHaveProperty('team');
    });

    test('with a team, prefers the team label when a workspace label has the same name', async () => {
      rawRequest.mockResolvedValueOnce({
        data: {
          issueLabels: {
            nodes: [
              { id: 'lab-ws', name: 'Bug', color: '#000000', isGroup: false, createdAt: 'x', team: null },
              { id: 'lab-team', name: 'Bug', color: '#000000', isGroup: false, createdAt: 'x', team: { id: UUID, key: 'ENG', name: 'Eng' } },
            ],
            pageInfo: { hasNextPage: false },
          },
        },
      });
      const result = await run({ name: 'linear_issue_label_create', propsValue: { name: 'Bug', team_id: UUID } });
      expect(result).toMatchObject({ created: false, id: 'lab-team' });
    });

    test('creates a workspace label when none matches', async () => {
      rawRequest.mockResolvedValueOnce({ data: { issueLabels: { nodes: [], pageInfo: { hasNextPage: false } } } });
      const result = await run({ name: 'linear_issue_label_create', propsValue: { name: 'Customer' } });
      expect(rawRequest.mock.calls[0][1]).toMatchObject({ filter: { team: { null: true } } });
      expect(lastCall().variables).toEqual({ input: { name: 'Customer' } });
      expect(result).toMatchObject({ created: true });
    });
  });

  test('issues_search filters by team through the filter, not the teamId boost', async () => {
    await run({ name: 'linear_issues_search', propsValue: { term: 'login', team_id: UUID } });
    const { variables } = lastCall();
    expect(variables['filter']).toEqual({ team: { id: { eq: UUID } } });
    expect(variables).not.toHaveProperty('teamId');
  });

  test('issue_delete never asks for a permanent delete', async () => {
    await run({ name: 'linear_issue_delete', propsValue: { issue_id: UUID } });
    const { query, variables } = lastCall();
    expect(query).not.toContain('permanentlyDelete');
    expect(variables).toEqual({ id: UUID });
  });

  describe('linear_upload_download host guard', () => {
    test('accepts only https uploads.linear.app links', () => {
      expect(assertLinearUploadUrl('https://uploads.linear.app/a/b/c.png').hostname).toBe('uploads.linear.app');
      for (const bad of [
        'http://uploads.linear.app/a.png',
        'https://uploads.linear.app.evil.io/a.png',
        'https://evil.io/uploads.linear.app/a.png',
        'https://user@uploads.linear.app/a.png',
        'https://uploads.linear.app:8443/a.png',
        '//uploads.linear.app/a.png',
        'not a url',
      ]) {
        expect(() => assertLinearUploadUrl(bad)).toThrow();
      }
    });
  });

  test('every atomic sends a request that can be captured for schema validation', async () => {
    const samples: Record<string, Record<string, unknown>> = {
      linear_issue_create: { team_id: UUID, title: 'T', description: 'D', assignee_id: UUID, state_id: UUID, priority: 2, label_ids: [UUID], project_id: UUID, project_milestone_id: UUID, cycle_id: UUID, parent_id: UUID2, due_date: '2026-10-15', estimate: 3, template_id: UUID },
      linear_issue_update: { issue_id: UUID, title: 'T', state_id: UUID, add_label_ids: [UUID], due_date: '2026-10-15', estimate: 2, clear_fields: ['assigneeId'] },
      linear_issue_get: { issue_id: 'ENG-1' },
      linear_issues_list: { team_id: UUID, project_id: UUID, assignee_id: UUID, state_type: 'started', label_id: UUID, cycle_id: UUID, priority: 1, updated_after: '2026-09-01T00:00:00Z', include_archived: true, order_by: 'updatedAt', limit: 10, cursor: 'abc' },
      linear_issues_search: { term: 'login', team_id: UUID, include_comments: true, limit: 5 },
      linear_issue_archive: { issue_id: UUID },
      linear_issue_unarchive: { issue_id: UUID },
      linear_issue_delete: { issue_id: UUID },
      linear_issue_relation_create: { issue_id: UUID, related_issue_id: UUID2, type: 'blocks' },
      linear_issue_add_label: { issue_id: UUID, label_id: UUID },
      linear_issue_remove_label: { issue_id: UUID, label_id: UUID },
      linear_issue_label_create: { name: 'Bug', team_id: UUID, color: '#EB5757', description: 'd' },
      linear_issue_labels_list: { team_id: UUID, name_contains: 'bu' },
      linear_workflow_states_list: { team_id: UUID },
      linear_teams_list: { include_archived: true },
      linear_team_get: { team_id: UUID },
      linear_team_update: { team_id: UUID, name: 'Platform 2', triage_enabled: 'true' },
      linear_users_list: { email: 'jane@acme.com', name_contains: 'ja', include_disabled: true },
      linear_viewer_get: {},
      linear_cycles_list: { team_id: UUID, which: 'isNext' },
      linear_comment_create: { issue_id: UUID, body: 'hello', parent_id: UUID2 },
      linear_comment_get: { comment_id: UUID },
      linear_comments_list: { issue_id: UUID },
      linear_comment_update: { comment_id: UUID, body: 'edited' },
      linear_comment_resolve: { comment_id: UUID, resolving_comment_id: UUID2 },
      linear_comment_unresolve: { comment_id: UUID },
      linear_comment_reaction_create: { comment_id: UUID, emoji: ':thumbsup:' },
      linear_reaction_delete: { reaction_id: UUID },
      linear_attachment_create: { issue_id: UUID, url: 'https://github.com/a/b/pull/1', title: 'PR 1', subtitle: 'Open' },
      linear_attachment_get: { attachment_id: UUID },
      linear_project_create: { team_ids: [UUID], name: 'P', description: 'S', lead_id: UUID, priority: 3, status_id: UUID, start_date: '2026-10-01', target_date: '2026-12-15', icon: 'Rocket', color: '#5E6AD2' },
      linear_project_update: { project_id: UUID, name: 'P2', clear_fields: ['leadId'] },
      linear_projects_list: { team_id: UUID, status_type: 'started', name_contains: 'web', include_archived: true },
      linear_project_get: { project_id: UUID },
      linear_project_delete: { project_id: UUID },
      linear_project_unarchive: { project_id: UUID },
      linear_project_milestone_create: { project_id: UUID, name: 'Beta', description: 'd', target_date: '2026-11-30' },
      linear_project_status_update_create: { project_id: UUID, body: 'On track', health: 'onTrack' },
      linear_project_status_update_get: { status_update_id: UUID },
      linear_project_status_updates_list: { project_id: UUID },
      linear_project_status_update_edit: { status_update_id: UUID, health: 'atRisk' },
      linear_project_status_update_archive: { status_update_id: UUID },
      linear_project_status_update_unarchive: { status_update_id: UUID },
    };
    const captured: Array<{ action: string; query: string; variables: unknown }> = [];
    for (const atomic of linearAtomics) {
      if (atomic.name === 'linear_upload_download') continue;
      const props = samples[atomic.name];
      expect(props, atomic.name).toBeDefined();
      rawRequest.mockClear();
      await run({ name: atomic.name, propsValue: props });
      expect(rawRequest, atomic.name).toHaveBeenCalled();
      for (const [query, variables] of rawRequest.mock.calls) {
        captured.push({ action: atomic.name, query, variables: JSON.parse(JSON.stringify(variables ?? {})) });
      }
    }
    expect(Object.keys(samples)).toHaveLength(43);
    rawRequest.mockImplementation(async () => ({ data: populated() }));
    for (const atomic of linearAtomics) {
      if (atomic.name === 'linear_upload_download' || !atomic.outputSchema) continue;
      const result = toRecord(await run({ name: atomic.name, propsValue: samples[atomic.name] }));
      const fields = atomic.outputSchema.fields;
      expect(Object.keys(result).sort(), atomic.name).toEqual(schemaKeys(fields));
      const itemsField = fields.find((field) => field.key === 'items');
      const items = result['items'];
      if (itemsField?.listItems && Array.isArray(items)) {
        expect(items.length, atomic.name).toBeGreaterThan(0);
        expect(Object.keys(items[0]).sort(), `${atomic.name} items`).toEqual(schemaKeys(itemsField.listItems));
      }
      const milestones = fields.find((field) => field.key === 'milestones');
      const milestoneItems = result['milestones'];
      if (milestones?.listItems && Array.isArray(milestoneItems)) {
        expect(Object.keys(milestoneItems[0]).sort(), `${atomic.name} milestones`).toEqual(schemaKeys(milestones.listItems));
      }
    }
    const out = process.env['LINEAR_CAPTURE_FILE'];
    if (out) writeFileSync(out, JSON.stringify(captured, null, 2));
  });

  describe('second calls stay idempotent (found in Tier-2)', () => {
    const invalidInput = (message: string) => Object.assign(new Error('x'), { type: 'InvalidInput', errors: [{ message }] });

    test('linear_issue_remove_label returns the issue when the label is already gone', async () => {
      rawRequest.mockRejectedValueOnce(invalidInput(`Label ${UUID2} is not on issue ${UUID} and cannot be removed.`));
      const result = toRecord(await run({ name: 'linear_issue_remove_label', propsValue: { issue_id: UUID, label_id: UUID2 } }));
      expect(result['id']).toBeDefined();
      expect(lastCall().query).toContain('LinearGetIssue');
    });

    test('linear_project_status_update_archive returns the update when it is already archived', async () => {
      rawRequest.mockRejectedValueOnce(invalidInput('Could not find referenced ProjectUpdate.'));
      rawRequest.mockResolvedValueOnce({ data: { projectUpdate: { id: UUID, body: 'b', url: 'u', isDiffHidden: false, createdAt: 'c', updatedAt: 'u', archivedAt: '2026-09-29T08:20:15.591Z' } } });
      const result = toRecord(await run({ name: 'linear_project_status_update_archive', propsValue: { status_update_id: UUID } }));
      expect(result).toMatchObject({ success: true, id: UUID, archived_at: '2026-09-29T08:20:15.591Z' });
    });

    test('linear_project_status_update_unarchive returns the update when it is already visible', async () => {
      rawRequest.mockRejectedValueOnce(invalidInput('Could not find referenced ProjectUpdate.'));
      rawRequest.mockResolvedValueOnce({ data: { projectUpdate: { id: UUID, body: 'b', url: 'u', isDiffHidden: false, createdAt: 'c', updatedAt: 'u', archivedAt: null } } });
      const result = toRecord(await run({ name: 'linear_project_status_update_unarchive', propsValue: { status_update_id: UUID } }));
      expect(result).toMatchObject({ success: true, id: UUID, archived_at: null });
    });

    test('archive still fails when the update does not exist', async () => {
      rawRequest.mockRejectedValueOnce(invalidInput('Could not find referenced ProjectUpdate.'));
      rawRequest.mockRejectedValueOnce(invalidInput('Could not find referenced ProjectUpdate.'));
      await expect(run({ name: 'linear_project_status_update_archive', propsValue: { status_update_id: UUID } })).rejects.toThrow('No Linear project status update found');
    });
  });
});

describe('review fixes', () => {
  beforeEach(() => {
    rawRequest.mockReset();
    rawRequest.mockImplementation(async () => ({ data: universal() }));
  });

  test('linear_issues_list combines state_id and state_type with AND', async () => {
    await run({ name: 'linear_issues_list', propsValue: { state_id: UUID, state_type: 'started' } });
    expect(lastCall().variables['filter']).toEqual({ state: { id: { eq: UUID }, type: { eq: 'started' } } });
    await run({ name: 'linear_issues_list', propsValue: { state_type: 'started' } });
    expect(lastCall().variables['filter']).toEqual({ state: { type: { eq: 'started' } } });
    await run({ name: 'linear_issues_list', propsValue: { state_id: UUID } });
    expect(lastCall().variables['filter']).toEqual({ state: { id: { eq: UUID } } });
    await run({ name: 'linear_issues_list', propsValue: {} });
    expect(lastCall().variables['filter']).toBeUndefined();
  });

  test('linear_project_get returns every milestone page', async () => {
    const milestone = (id: string) => ({ id, name: `M ${id}`, targetDate: null, status: 'next' });
    rawRequest.mockImplementation(async (query: string, variables: Record<string, unknown>) => {
      if (query.includes('LinearAtomicProjectGet')) {
        return {
          data: {
            project: {
              id: UUID,
              name: 'P',
              projectMilestones: { pageInfo: { hasNextPage: true, endCursor: 'c1' }, nodes: [milestone('m1'), milestone('m2')] },
            },
          },
        };
      }
      if (variables['after'] === 'c1') {
        return { data: { project: { id: UUID, projectMilestones: { pageInfo: { hasNextPage: true, endCursor: 'c2' }, nodes: [milestone('m3')] } } } };
      }
      return { data: { project: { id: UUID, projectMilestones: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [milestone('m4')] } } } };
    });
    const result = toRecord(await run({ name: 'linear_project_get', propsValue: { project_id: UUID } }));
    const milestones = result['milestones'];
    expect(Array.isArray(milestones) ? milestones.map((m) => m.id) : milestones).toEqual(['m1', 'm2', 'm3', 'm4']);
    const pageCalls = rawRequest.mock.calls.filter(([query]) => String(query).includes('LinearAtomicProjectMilestonesPage'));
    expect(pageCalls.map(([, variables]) => variables.after)).toEqual(['c1', 'c2']);
  });
});

describe('pre-review fixes', () => {
  beforeEach(() => {
    rawRequest.mockReset();
    rawRequest.mockImplementation(async () => ({ data: universal() }));
  });

  const labels = ({ from, count }: { from: number; count: number }) =>
    Array.from({ length: count }, (_, index) => ({ id: `label-${from + index}`, name: `L${from + index}` }));
  const teams = ({ from, count }: { from: number; count: number }) =>
    Array.from({ length: count }, (_, index) => ({ id: `team-${from + index}`, key: `T${from + index}`, name: `Team ${from + index}` }));
  const issue = ({ id, count, hasNextPage }: { id: string; count: number; hasNextPage: boolean }) => ({
    id,
    identifier: 'ENG-1',
    title: 'T',
    labels: { pageInfo: { hasNextPage, endCursor: hasNextPage ? `${id}-labels-1` : null }, nodes: labels({ from: 0, count }) },
  });
  const project = ({ id, count, hasNextPage }: { id: string; count: number; hasNextPage: boolean }) => ({
    id,
    name: 'P',
    teams: { pageInfo: { hasNextPage, endCursor: hasNextPage ? `${id}-teams-1` : null }, nodes: teams({ from: 0, count }) },
    projectMilestones: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] },
  });
  const pagedRelations = (first: Record<string, unknown>) => async (query: string, variables: Record<string, unknown>) => {
    if (query.includes('LinearIssueLabelsPage')) {
      const after = String(variables['after']);
      if (after.endsWith('-labels-1')) {
        return { data: { issue: { labels: { pageInfo: { hasNextPage: true, endCursor: after.replace('-1', '-2') }, nodes: labels({ from: 20, count: 250 }) } } } };
      }
      return { data: { issue: { labels: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: labels({ from: 270, count: 5 }) } } } };
    }
    if (query.includes('LinearAtomicProjectTeamsPage')) {
      return { data: { project: { teams: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: teams({ from: 20, count: 12 }) } } } };
    }
    return { data: first };
  };

  test.each([
    { name: 'linear_issue_get', propsValue: { issue_id: UUID }, first: { issue: issue({ id: UUID, count: 20, hasNextPage: true }) } },
    { name: 'linear_issue_create', propsValue: { team_id: UUID, title: 'T' }, first: { issueCreate: { success: true, issue: issue({ id: UUID, count: 20, hasNextPage: true }) } } },
    { name: 'linear_issue_update', propsValue: { issue_id: UUID, title: 'T' }, first: { issueUpdate: { success: true, issue: issue({ id: UUID, count: 20, hasNextPage: true }) } } },
    { name: 'linear_issue_add_label', propsValue: { issue_id: UUID, label_id: UUID2 }, first: { issueAddLabel: { success: true, issue: issue({ id: UUID, count: 20, hasNextPage: true }) } } },
    { name: 'linear_issue_remove_label', propsValue: { issue_id: UUID, label_id: UUID2 }, first: { issueRemoveLabel: { success: true, issue: issue({ id: UUID, count: 20, hasNextPage: true }) } } },
  ])('$name returns every label of an issue with more than 20', async ({ name, propsValue, first }) => {
    rawRequest.mockImplementation(pagedRelations(first));
    const result = toRecord(await run({ name, propsValue }));
    expect(result['label_ids']).toEqual(labels({ from: 0, count: 275 }).map((label) => label.id));
    const pages = rawRequest.mock.calls.filter(([query]) => String(query).includes('LinearIssueLabelsPage'));
    expect(pages.map(([, variables]) => variables)).toEqual([
      { id: UUID, after: `${UUID}-labels-1` },
      { id: UUID, after: `${UUID}-labels-2` },
    ]);
  });

  test.each([
    { name: 'linear_issues_list', propsValue: {}, field: 'issues' },
    { name: 'linear_issues_search', propsValue: { term: 'x' }, field: 'searchIssues' },
  ])('$name completes the labels only of the issues that have more than 20', async ({ name, propsValue, field }) => {
    rawRequest.mockImplementation(
      pagedRelations({ [field]: { totalCount: 2, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [issue({ id: 'a', count: 20, hasNextPage: true }), issue({ id: 'b', count: 3, hasNextPage: false })] } }),
    );
    const result = toRecord(await run({ name, propsValue }));
    const items = Array.isArray(result['items']) ? result['items'].map((item) => toRecord(item)['label_ids']) : [];
    expect(items).toEqual([labels({ from: 0, count: 275 }).map((label) => label.id), ['label-0', 'label-1', 'label-2']]);
    const pages = rawRequest.mock.calls.filter(([query]) => String(query).includes('LinearIssueLabelsPage'));
    expect(pages.map(([, variables]) => variables['id'])).toEqual(['a', 'a']);
  });

  test.each([
    { name: 'linear_project_get', propsValue: { project_id: UUID }, first: { project: project({ id: UUID, count: 20, hasNextPage: true }) } },
    { name: 'linear_project_create', propsValue: { name: 'P', team_ids: [UUID] }, first: { projectCreate: { success: true, project: project({ id: UUID, count: 20, hasNextPage: true }) } } },
    { name: 'linear_project_update', propsValue: { project_id: UUID, name: 'P' }, first: { projectUpdate: { success: true, project: project({ id: UUID, count: 20, hasNextPage: true }) } } },
  ])('$name returns every team of a project with more than 20', async ({ name, propsValue, first }) => {
    rawRequest.mockImplementation(pagedRelations(first));
    const result = toRecord(await run({ name, propsValue }));
    expect(result['team_ids']).toEqual(teams({ from: 0, count: 32 }).map((team) => team.id));
    const pages = rawRequest.mock.calls.filter(([query]) => String(query).includes('LinearAtomicProjectTeamsPage'));
    expect(pages.map(([, variables]) => variables)).toEqual([{ id: UUID, after: `${UUID}-teams-1` }]);
  });

  test.each([
    {
      name: 'linear_issue_create',
      propsValue: { team_id: UUID, title: 'T' },
      first: { issueCreate: { success: true, issue: issue({ id: UUID, count: 20, hasNextPage: true }) } },
      pageQuery: 'LinearIssueLabelsPage',
      field: 'label_ids',
      expected: labels({ from: 0, count: 20 }).map((label) => label.id),
    },
    {
      name: 'linear_project_create',
      propsValue: { name: 'P', team_ids: [UUID] },
      first: { projectCreate: { success: true, project: project({ id: UUID, count: 20, hasNextPage: true }) } },
      pageQuery: 'LinearAtomicProjectTeamsPage',
      field: 'team_ids',
      expected: teams({ from: 0, count: 20 }).map((team) => team.id),
    },
  ])('$name returns the created record from the mutation when reading the remaining pages fails', async ({ name, propsValue, first, pageQuery, field, expected }) => {
    rawRequest.mockImplementation(async (query: string) => {
      if (query.includes(pageQuery)) {
        throw new Error('Linear rate limit reached.');
      }
      return { data: first };
    });
    const result = toRecord(await run({ name, propsValue }));
    expect(result).toMatchObject({ id: UUID });
    expect(result[field]).toEqual(expected);
    expect(rawRequest.mock.calls.filter(([query]) => String(query).includes(pageQuery))).toHaveLength(1);
  });

  test.each([
    { name: 'linear_issues_list', fragment: 'labels(first: 20)' },
    { name: 'linear_projects_list', fragment: 'teams(first: 20)' },
  ])('$name asks for 20 nested records per item to stay under Linear complexity limit', async ({ name, fragment }) => {
    await run({ name, propsValue: { limit: 250 } });
    expect(String(rawRequest.mock.calls[0][0])).toContain(fragment);
    expect(rawRequest.mock.calls[0][1]).toMatchObject({ first: 250 });
  });

  test.each(['linear_issue_add_label', 'linear_issue_remove_label'])('%s asks for the label before looking up the issue', async (name) => {
    await expect(run({ name, propsValue: { issue_id: 'ENG-7', label_id: '  ' } })).rejects.toThrow('Label ID is required.');
    expect(rawRequest).not.toHaveBeenCalled();
  });

  test('linear_projects_list completes the teams of each project that has more than 20', async () => {
    rawRequest.mockImplementation(
      pagedRelations({ projects: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [project({ id: 'p1', count: 20, hasNextPage: true }), project({ id: 'p2', count: 2, hasNextPage: false })] } }),
    );
    const result = toRecord(await run({ name: 'linear_projects_list', propsValue: {} }));
    const items = Array.isArray(result['items']) ? result['items'].map((item) => toRecord(item)['team_ids']) : [];
    expect(items).toEqual([teams({ from: 0, count: 32 }).map((team) => team.id), ['team-0', 'team-1']]);
  });

  test.each([
    { name: 'linear_issue_archive', propsValue: { issue_id: UUID }, field: 'issueArchive', entity: { id: UUID, archivedAt: '2026-09-29T15:47:48.633Z' } },
    { name: 'linear_issue_unarchive', propsValue: { issue_id: UUID }, field: 'issueUnarchive', entity: { id: UUID, archivedAt: null } },
    { name: 'linear_project_unarchive', propsValue: { project_id: UUID }, field: 'projectUnarchive', entity: { id: UUID, archivedAt: null } },
  ])('$name: a second call returns normally, as Linear answers success again (probed live)', async ({ name, propsValue, field, entity }) => {
    rawRequest.mockImplementation(async () => ({ data: { [field]: { success: true, entity } } }));
    const first = toRecord(await run({ name, propsValue }));
    const second = toRecord(await run({ name, propsValue }));
    expect(second).toEqual(first);
    expect(second).toMatchObject({ success: true, id: UUID, archived_at: entity.archivedAt });
  });

  test.each([
    { name: 'linear_comment_resolve', field: 'commentResolve', resolvedAt: '2026-09-29T15:48:09.856Z' },
    { name: 'linear_comment_unresolve', field: 'commentUnresolve', resolvedAt: null },
  ])('$name: a second call returns normally, as Linear answers success again (probed live)', async ({ name, field, resolvedAt }) => {
    rawRequest.mockImplementation(async () => ({ data: { [field]: { success: true, comment: { id: UUID, body: 'b', url: 'u', createdAt: 'c', updatedAt: 'u', resolvedAt } } } }));
    const first = toRecord(await run({ name, propsValue: { comment_id: UUID } }));
    const second = toRecord(await run({ name, propsValue: { comment_id: UUID } }));
    expect(second).toEqual(first);
    expect(second).toMatchObject({ id: UUID, resolved_at: resolvedAt });
  });
});
