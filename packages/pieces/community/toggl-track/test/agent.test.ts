import { describe, expect, it } from 'vitest';
import { AgentProject, togglAgent } from '../src/lib/common/agent';

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

  it('requires a positive duration in minutes', () => {
    expect(togglAgent.parseDurationMinutes({ value: '25' })).toBe(25);
    expect(togglAgent.parseDurationMinutes({ value: 0.6 })).toBe(1);
    expect(() => togglAgent.parseDurationMinutes({ value: 0 })).toThrow(/positive number of minutes/);
    expect(() => togglAgent.parseDurationMinutes({ value: 'abc' })).toThrow(/positive number of minutes/);
  });

  it('treats "now" and ISO datetimes as start values', () => {
    const before = Date.now();
    const now = new Date(togglAgent.parseStart({ value: 'NOW' })).getTime();
    expect(now).toBeGreaterThanOrEqual(before - 1000);
    expect(togglAgent.parseStart({ value: '2026-10-08T10:00:00Z' })).toBe('2026-10-08T10:00:00.000Z');
    expect(() => togglAgent.parseStart({ value: 'yesterday' })).toThrow(/not a valid date/);
  });
});
