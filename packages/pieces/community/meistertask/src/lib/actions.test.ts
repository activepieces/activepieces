import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTask } from './actions/create-task';
import { updateTask } from './actions/update-task';
import { findTask } from './actions/find-task';
import { createProject } from './actions/create-project';
import { taskCreated } from './triggers/task-created';
import { taskCompleted } from './triggers/task-completed';
import { getAccessToken } from './auth';

const OAUTH2_AUTH = {
  type: AppConnectionType.OAUTH2,
  access_token: 'test-oauth-access-token',
  data: {},
};

const API_TOKEN_AUTH = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: {
    token: 'test-api-token-xyz',
  },
};

function mockResponse(body: unknown, status = 200): HttpResponse {
  return { status, headers: {}, body };
}

function createContext(propsValue: Record<string, unknown>, auth: unknown = OAUTH2_AUTH) {
  return { auth, propsValue } as never;
}

let sendRequestSpy: ReturnType<typeof vi.spyOn>;

function getCapturedRequests(): HttpRequest[] {
  return sendRequestSpy.mock.calls.map((call) => call[0] as HttpRequest);
}

beforeEach(() => {
  sendRequestSpy = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MeisterTask Auth Resolution', () => {
  it('correctly extracts access token from OAuth2 auth object', () => {
    const token = getAccessToken(OAUTH2_AUTH);
    expect(token).toBe('test-oauth-access-token');
  });

  it('correctly extracts token from CustomAuth API Token object', () => {
    const token = getAccessToken(API_TOKEN_AUTH);
    expect(token).toBe('test-api-token-xyz');
  });

  it('handles plain string tokens and direct object tokens gracefully', () => {
    expect(getAccessToken('raw-token-123')).toBe('raw-token-123');
    expect(getAccessToken({ access_token: 'direct-access-token' })).toBe('direct-access-token');
    expect(getAccessToken({ token: 'direct-token' })).toBe('direct-token');
    expect(getAccessToken(null)).toBe('');
  });
});

describe('createTask action', () => {
  it('sends POST request to /tasks with proper headers, body payload, and returns parsed task', async () => {
    const mockTask = {
      id: 101,
      name: 'Implement OAuth Flow',
      section_id: '55',
      notes: 'Detailed specification for OAuth',
      assigned_to_id: '12',
      due: '2026-09-01T00:00:00Z',
      status: 1,
    };

    sendRequestSpy.mockResolvedValue(mockResponse(mockTask));

    const result = await createTask.run(
      createContext({
        project: 10,
        section: '55',
        name: 'Implement OAuth Flow',
        notes: 'Detailed specification for OAuth',
        assigned_to: '12',
        due_date: '2026-09-01T00:00:00Z',
      }, OAUTH2_AUTH)
    );

    expect(result).toEqual(mockTask);
    const requests = getCapturedRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe(HttpMethod.POST);
    expect(requests[0].url).toBe('https://www.meistertask.com/api/tasks');
    expect(requests[0].authentication).toEqual({
      type: AuthenticationType.BEARER_TOKEN,
      token: 'test-oauth-access-token',
    });
    expect(requests[0].body).toEqual({
      name: 'Implement OAuth Flow',
      section_id: '55',
      notes: 'Detailed specification for OAuth',
      assigned_to_id: '12',
      due: '2026-09-01T00:00:00Z',
    });
  });

  it('works seamlessly with API Token authentication', async () => {
    const mockTask = {
      id: 102,
      name: 'Minimal Task',
      section_id: '55',
    };

    sendRequestSpy.mockResolvedValue(mockResponse(mockTask));

    const result = await createTask.run(
      createContext({
        project: 10,
        section: '55',
        name: 'Minimal Task',
      }, API_TOKEN_AUTH)
    );

    expect(result).toEqual(mockTask);
    const requests = getCapturedRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].authentication).toEqual({
      type: AuthenticationType.BEARER_TOKEN,
      token: 'test-api-token-xyz',
    });
    expect(requests[0].body).toEqual({
      name: 'Minimal Task',
      section_id: '55',
    });
  });
});

describe('updateTask action', () => {
  it('sends PUT request to /tasks/:task_id with updated fields and returns parsed task', async () => {
    const mockUpdatedTask = {
      id: 202,
      name: 'Updated Task Name',
      notes: 'Updated description',
      status: 2,
      assigned_to_id: '14',
      due: '2026-10-15T12:00:00Z',
    };

    sendRequestSpy.mockResolvedValue(mockResponse(mockUpdatedTask));

    const result = await updateTask.run(
      createContext({
        task_id: 202,
        name: 'Updated Task Name',
        notes: 'Updated description',
        status: 2,
        assigned_to: '14',
        due_date: '2026-10-15T12:00:00Z',
      }, OAUTH2_AUTH)
    );

    expect(result).toEqual(mockUpdatedTask);
    const requests = getCapturedRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe(HttpMethod.PUT);
    expect(requests[0].url).toBe('https://www.meistertask.com/api/tasks/202');
    expect(requests[0].authentication).toEqual({
      type: AuthenticationType.BEARER_TOKEN,
      token: 'test-oauth-access-token',
    });
    expect(requests[0].body).toEqual({
      name: 'Updated Task Name',
      notes: 'Updated description',
      status: 2,
      assigned_to_id: '14',
      due: '2026-10-15T12:00:00Z',
    });
  });

  it('only serializes defined fields during partial updates', async () => {
    const mockTask = { id: 303, status: 2 };
    sendRequestSpy.mockResolvedValue(mockResponse(mockTask));

    await updateTask.run(
      createContext({
        task_id: 303,
        status: 2,
      }, API_TOKEN_AUTH)
    );

    const requests = getCapturedRequests();
    expect(requests[0].body).toEqual({
      status: 2,
    });
  });
});

describe('findTask action', () => {
  it('sends GET request to /sections/:section/tasks and filters by name case-insensitively', async () => {
    const mockTasks = [
      { id: 1, name: 'Setup database' },
      { id: 2, name: 'Build Frontend UI' },
      { id: 3, name: 'Write Integration Tests' },
    ];

    sendRequestSpy.mockResolvedValue(mockResponse(mockTasks));

    const result = await findTask.run(
      createContext({
        project: 10,
        section: 42,
        name: 'frontend',
      }, OAUTH2_AUTH)
    );

    expect(result).toEqual({ id: 2, name: 'Build Frontend UI' });
    const requests = getCapturedRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe(HttpMethod.GET);
    expect(requests[0].url).toBe('https://www.meistertask.com/api/sections/42/tasks');
    expect(requests[0].authentication).toEqual({
      type: AuthenticationType.BEARER_TOKEN,
      token: 'test-oauth-access-token',
    });
  });

  it('returns null when no task matches the search term', async () => {
    const mockTasks = [
      { id: 1, name: 'Setup database' },
    ];

    sendRequestSpy.mockResolvedValue(mockResponse(mockTasks));

    const result = await findTask.run(
      createContext({
        project: 10,
        section: 42,
        name: 'Nonexistent Task',
      }, API_TOKEN_AUTH)
    );

    expect(result).toBeNull();
  });

  it('returns the first task when no search query is specified', async () => {
    const mockTasks = [
      { id: 1, name: 'First Task' },
      { id: 2, name: 'Second Task' },
    ];

    sendRequestSpy.mockResolvedValue(mockResponse(mockTasks));

    const result = await findTask.run(
      createContext({
        project: 10,
        section: 42,
      }, OAUTH2_AUTH)
    );

    expect(result).toEqual({ id: 1, name: 'First Task' });
  });
});

describe('createProject action', () => {
  it('sends POST request to /projects with name, notes, and status, returning parsed project', async () => {
    const mockProject = {
      id: 501,
      name: 'New Product Launch',
      notes: 'Roadmap and tracking for Q3 launch',
      status: 1,
      created_at: '2026-08-16T10:00:00Z',
    };

    sendRequestSpy.mockResolvedValue(mockResponse(mockProject));

    const result = await createProject.run(
      createContext({
        name: 'New Product Launch',
        notes: 'Roadmap and tracking for Q3 launch',
        status: 1,
      }, OAUTH2_AUTH)
    );

    expect(result).toEqual(mockProject);
    const requests = getCapturedRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe(HttpMethod.POST);
    expect(requests[0].url).toBe('https://www.meistertask.com/api/projects');
    expect(requests[0].authentication).toEqual({
      type: AuthenticationType.BEARER_TOKEN,
      token: 'test-oauth-access-token',
    });
    expect(requests[0].body).toEqual({
      name: 'New Product Launch',
      notes: 'Roadmap and tracking for Q3 launch',
      status: 1,
    });
  });

  it('creates project with API Token authentication without optional fields', async () => {
    const mockProject = {
      id: 502,
      name: 'Simple Project',
      status: 1,
    };

    sendRequestSpy.mockResolvedValue(mockResponse(mockProject));

    const result = await createProject.run(
      createContext({
        name: 'Simple Project',
      }, API_TOKEN_AUTH)
    );

    expect(result).toEqual(mockProject);
    const requests = getCapturedRequests();
    expect(requests[0].body).toEqual({
      name: 'Simple Project',
    });
  });
});

describe('MeisterTask Triggers (taskCreated and taskCompleted)', () => {
  it('taskCreated trigger tests successfully against API endpoint', async () => {
    const mockTasks = [
      {
        id: 99,
        name: 'New Task In Trigger',
        created_at: '2026-08-16T10:00:00Z',
      },
    ];

    sendRequestSpy.mockResolvedValue(mockResponse(mockTasks));

    const testResults = await taskCreated.test(
      createContext({ project: 'p1', section: 's1' }, OAUTH2_AUTH)
    );

    expect(testResults).toEqual(mockTasks);
    const requests = getCapturedRequests();
    expect(requests[0].url).toBe('https://www.meistertask.com/api/sections/s1/tasks');
  });

  it('taskCompleted trigger filters completed status tasks', async () => {
    const mockTasks = [
      { id: 1, name: 'Task 1', status: 1, updated_at: '2026-08-16T10:00:00Z' },
      { id: 2, name: 'Task 2', status: 2, status_updated_at: '2026-08-16T10:05:00Z' },
    ];

    sendRequestSpy.mockResolvedValue(mockResponse(mockTasks));

    const testResults = await taskCompleted.test(
      createContext({ project: 'p1' }, API_TOKEN_AUTH)
    );

    expect(testResults).toEqual([mockTasks[1]]);
    const requests = getCapturedRequests();
    expect(requests[0].url).toBe('https://www.meistertask.com/api/projects/p1/tasks');
    expect(requests[0].authentication).toEqual({
      type: AuthenticationType.BEARER_TOKEN,
      token: 'test-api-token-xyz',
    });
  });
});
