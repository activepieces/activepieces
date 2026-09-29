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
        return { data: { project: { id: 'p1', teams: { nodes: [{ id: 'team-a' }, { id: 'team-b' }] } } } };
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

  test('does not duplicate a team the project already has', async () => {
    await run({ team_id: 'team-b', project_id: 'p1', name: 'Renamed' });
    expect(sentInput().teamIds).toEqual(['team-a', 'team-b']);
  });

  test('name is optional and not sent when left empty', async () => {
    await run({ team_id: 'team-a', project_id: 'p1', description: 'New summary' });
    const input = sentInput();
    expect(input.name).toBeUndefined();
    expect(JSON.parse(JSON.stringify(input))).not.toHaveProperty('name');
    expect(input.description).toBe('New summary');
  });
});
