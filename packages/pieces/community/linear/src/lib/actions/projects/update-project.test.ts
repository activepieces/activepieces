/// <reference types="vitest/globals" />

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
import { linearUpdateProject } from './update-project';

const auth = { type: 'SECRET_TEXT', secret_text: 'lin_api_test' };

function run(propsValue: Record<string, unknown>) {
  return linearUpdateProject.run({ ...createMockActionContext({ propsValue }), auth });
}

describe('linear_update_project team handling (F1)', () => {
  beforeEach(() => {
    rawRequest.mockReset();
    rawRequest.mockImplementation(async (query: string) => {
      if (query.includes('LinearProjectTeamIds')) {
        return {
          data: {
            project: {
              id: 'p1',
              teams: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'team-a' }, { id: 'team-b' }] },
            },
          },
        };
      }
      return { data: { projectUpdate: { success: true, lastSyncId: 1, project: { id: 'p1' } } } };
    });
  });

  function sentInput() {
    const mutation = rawRequest.mock.calls.find(([query]) => String(query).includes('UpdateProject('));
    return mutation?.[1]?.input;
  }

  test('keeps the current teams and adds the selected one', async () => {
    await run({ team_id: 'team-c', project_id: 'p1', name: 'Renamed' });
    expect(sentInput().teamIds).toEqual(['team-a', 'team-b', 'team-c']);
  });

  test('does not send teamIds when the selected team is already on the project', async () => {
    await run({ team_id: 'team-b', project_id: 'p1', name: 'Renamed' });
    const input = sentInput();
    expect(input.teamIds).toBeUndefined();
    expect(JSON.parse(JSON.stringify(input))).not.toHaveProperty('teamIds');
    expect(input.name).toBe('Renamed');
  });

  test('reads every page of teams before adding a new one', async () => {
    const firstPage = Array.from({ length: 250 }, (_, index) => ({ id: `team-${index}` }));
    rawRequest.mockImplementation(async (query: string, variables?: Record<string, unknown>) => {
      if (query.includes('LinearProjectTeamIds')) {
        const after = variables?.['after'];
        if (after === undefined) {
          return { data: { project: { id: 'p1', teams: { pageInfo: { hasNextPage: true, endCursor: 'c1' }, nodes: firstPage } } } };
        }
        if (after === 'c1') {
          return { data: { project: { id: 'p1', teams: { pageInfo: { hasNextPage: true, endCursor: 'c2' }, nodes: [{ id: 'team-250' }] } } } };
        }
        return { data: { project: { id: 'p1', teams: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'team-251' }] } } } };
      }
      return { data: { projectUpdate: { success: true, lastSyncId: 1, project: { id: 'p1' } } } };
    });
    await run({ team_id: 'team-new', project_id: 'p1' });
    const teamQueries = rawRequest.mock.calls.filter(([query]) => String(query).includes('LinearProjectTeamIds'));
    expect(teamQueries.map(([, variables]) => variables.after)).toEqual([undefined, 'c1', 'c2']);
    const teamIds = sentInput().teamIds;
    expect(teamIds).toHaveLength(253);
    expect(teamIds.slice(-3)).toEqual(['team-250', 'team-251', 'team-new']);
  });

  test('does not send teamIds when the selected team is on a later page', async () => {
    rawRequest.mockImplementation(async (query: string, variables?: Record<string, unknown>) => {
      if (query.includes('LinearProjectTeamIds')) {
        if (variables?.['after'] === undefined) {
          return { data: { project: { id: 'p1', teams: { pageInfo: { hasNextPage: true, endCursor: 'c1' }, nodes: [{ id: 'team-a' }] } } } };
        }
        return { data: { project: { id: 'p1', teams: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'team-z' }] } } } };
      }
      return { data: { projectUpdate: { success: true, lastSyncId: 1, project: { id: 'p1' } } } };
    });
    await run({ team_id: 'team-z', project_id: 'p1', name: 'Renamed' });
    expect(sentInput().teamIds).toBeUndefined();
  });

  test('name is optional and not sent when left empty', async () => {
    await run({ team_id: 'team-a', project_id: 'p1', description: 'New summary' });
    const input = sentInput();
    expect(input.name).toBeUndefined();
    expect(JSON.parse(JSON.stringify(input))).not.toHaveProperty('name');
    expect(input.description).toBe('New summary');
  });
});
