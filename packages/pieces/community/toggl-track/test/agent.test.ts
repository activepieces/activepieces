import { describe, expect, it } from 'vitest';
import { AgentProject, togglAgent } from '../src/lib/common/agent';
import { togglApi } from '../src/lib/common/client';
import { togglCommon } from '../src/lib/common';
import { createTimeEntry } from '../src/lib/actions/create-time-entry';
import { startTimeEntry } from '../src/lib/actions/start-time-entry';
import { updateTimeEntry } from '../src/lib/actions/update-time-entry';
import { newTimeEntry } from '../src/lib/triggers/new-time-entry';

const projects: AgentProject[] = [
  { id: 1, name: 'Website', workspaceId: 10, clientName: 'Acme' },
  { id: 2, name: 'App', workspaceId: 10, clientName: null },
  { id: 3, name: 'app', workspaceId: 11, clientName: 'Beta' },
];

describe('pickProject', () => {
  it('finds a project by numeric id', () => {
    expect(togglAgent.pickProject({ projects, reference: '3' }).workspaceId).toBe(11);
  });

  it('finds a unique name case-insensitively', () => {
    expect(togglAgent.pickProject({ projects, reference: 'WEBSITE' }).id).toBe(1);
  });

  it('lists ids when the name is ambiguous', () => {
    expect(() => togglAgent.pickProject({ projects, reference: 'App' })).toThrow(
      /2 projects are named "App" \(IDs: 2, 3\)/
    );
  });

  it('lists candidates when the name is unknown', () => {
    expect(() => togglAgent.pickProject({ projects, reference: 'Nope' })).toThrow(
      /Project "Nope" was not found\. Projects: Website \(1\), App \(2\), app \(3\)\./
    );
  });
});

describe('summarize', () => {
  const entries = [
    { seconds: 3600, projectId: 1, projectName: 'Website', userId: 7, userName: 'Jo', clientId: 5, clientName: 'Acme' },
    { seconds: 1800, projectId: 1, projectName: 'Website', userId: 8, userName: 'Al', clientId: 5, clientName: 'Acme' },
    { seconds: 900, projectId: null, projectName: null, userId: 7, userName: 'Jo', clientId: null, clientName: null },
    { seconds: -1, projectId: 2, projectName: 'App', userId: 7, userName: 'Jo', clientId: null, clientName: null },
  ];

  it('groups by project with totals, counts, and no-project fallback', () => {
    const summary = togglAgent.summarize({ entries, groupBy: 'project' });
    expect(summary.total_seconds).toBe(6300);
    expect(summary.total_hours).toBe(1.75);
    expect(summary.groups).toEqual([
      { id: 1, name: 'Website', seconds: 5400, hours: 1.5, entry_count: 2 },
      { id: null, name: 'No project', seconds: 900, hours: 0.25, entry_count: 1 },
    ]);
  });

  it('groups by user and skips running entries', () => {
    const summary = togglAgent.summarize({ entries, groupBy: 'user' });
    expect(summary.groups.map((group) => [group.name, group.seconds, group.entry_count])).toEqual([
      ['Jo', 4500, 2],
      ['Al', 1800, 1],
    ]);
  });

  it('groups by client with the no-client fallback', () => {
    const summary = togglAgent.summarize({ entries, groupBy: 'client' });
    expect(summary.groups).toEqual([
      { id: 5, name: 'Acme', seconds: 5400, hours: 1.5, entry_count: 2 },
      { id: null, name: 'No client', seconds: 900, hours: 0.25, entry_count: 1 },
    ]);
  });
});

describe('input parsing', () => {
  it('accepts only the three group-by values', () => {
    expect(togglAgent.parseGroupBy(undefined)).toBe('project');
    expect(togglAgent.parseGroupBy(' USER ')).toBe('user');
    expect(() => togglAgent.parseGroupBy('team')).toThrow(/must be "project", "user", or "client"/);
  });

  it('converts minutes to seconds, rounding after the multiplication', () => {
    expect(togglAgent.durationSeconds({ minutes: '25' })).toBe(1500);
    expect(togglAgent.durationSeconds({ minutes: 1.5 })).toBe(90);
    expect(togglAgent.durationSeconds({ minutes: 0.25 })).toBe(15);
    expect(togglAgent.durationSeconds({ minutes: 0.6 })).toBe(36);
  });

  it('rejects durations that are not a positive number of seconds', () => {
    expect(() => togglAgent.durationSeconds({ minutes: 0 })).toThrow(/positive number of minutes/);
    expect(() => togglAgent.durationSeconds({ minutes: -5 })).toThrow(/positive number of minutes/);
    expect(() => togglAgent.durationSeconds({ minutes: 0.004 })).toThrow(/positive number of minutes/);
    expect(() => togglAgent.durationSeconds({ minutes: 'abc' })).toThrow(/positive number of minutes/);
  });

  it('treats "now" and ISO datetimes as start values', () => {
    const before = Date.now();
    const now = new Date(togglAgent.parseStart({ value: 'NOW' })).getTime();
    expect(now).toBeGreaterThanOrEqual(before - 1000);
    expect(togglAgent.parseStart({ value: '2026-10-08T10:00:00Z' })).toBe('2026-10-08T10:00:00.000Z');
    expect(() => togglAgent.parseStart({ value: 'yesterday' })).toThrow(/not a valid date/);
  });
});


describe('task dropdown refreshers', () => {
  it.each([
    ['create_time_entry', createTimeEntry],
    ['start_time_entry', startTimeEntry],
    ['update_time_entry', updateTimeEntry],
    ['new_time_entry trigger', newTimeEntry],
  ])('%s refreshers only name props that exist on the action', (_name, action) => {
    const propNames = Object.keys(action.props);
    for (const prop of Object.values(action.props)) {
      const refreshers = (prop as { refreshers?: string[] }).refreshers ?? [];
      for (const refresher of refreshers) {
        expect(propNames).toContain(refresher);
      }
    }
  });

  it('refreshes the task dropdown from the project prop', () => {
    const taskProp = updateTimeEntry.props['task_id'] as { refreshers: string[] };
    expect(taskProp.refreshers).toEqual(['workspace_id', 'project_id']);
  });
});

describe('clearing tags', () => {
  it('keeps the current tags when nothing is set', () => {
    expect(togglCommon.tagListValue({ tags: undefined, clearTags: undefined })).toBeUndefined();
    expect(togglCommon.tagListValue({ tags: [], clearTags: false })).toBeUndefined();
  });

  it('returns the selected tags', () => {
    expect(togglCommon.tagListValue({ tags: ['a', 'b'], clearTags: false })).toEqual(['a', 'b']);
  });

  it('returns an empty list when Clear Tags is set', () => {
    expect(togglCommon.tagListValue({ tags: [], clearTags: true })).toEqual([]);
    expect(togglCommon.tagListValue({ tags: undefined, clearTags: true })).toEqual([]);
  });

  it('rejects Tags combined with Clear Tags', () => {
    expect(() => togglCommon.tagListValue({ tags: ['a'], clearTags: true })).toThrow(
      /Set Tags or Clear Tags, not both/
    );
  });

  it('resolves an empty tag list to an empty id list on Toggl 2.0', async () => {
    const auth = togglApi.twoConnection({
      props: { token: 'test-token', organization_id: '1' },
    });
    if (!togglApi.isTwo(auth)) {
      throw new Error('expected a Toggl 2.0 connection');
    }
    await expect(
      togglApi.resolveTwoTagIds({ auth, workspaceId: 1, names: [] })
    ).resolves.toEqual([]);
    await expect(
      togglApi.resolveTwoTagIds({ auth, workspaceId: 1, names: undefined })
    ).resolves.toBeUndefined();
  });
});
