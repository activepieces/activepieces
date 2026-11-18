import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import '../../index';
import { asanaCreateTaskAction } from './create-task';

const TASKS_URL = 'https://app.asana.com/api/1.0/tasks';
const TAGS_URL = 'https://app.asana.com/api/1.0/tags';

function mockAsana({ tags }: { tags: { gid: string; name: string }[] }) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    if (request.method === HttpMethod.GET && request.url === TAGS_URL) {
      return { status: 200, headers: {}, body: { data: tags, next_page: null } };
    }
    if (request.method === HttpMethod.POST && request.url === TASKS_URL) {
      return { status: 201, headers: {}, body: { data: { gid: '9001' } } };
    }
    throw new Error(`Unexpected request ${request.method} ${request.url}`);
  });
}

function runCreateTask(overrides: Record<string, unknown>) {
  const propsValue = {
    workspace: '100',
    project: '200',
    name: 'Review the Q4 budget',
    notes: undefined,
    due_on: undefined,
    tags: undefined,
    assignee: undefined,
    ...overrides,
  };
  const base = createMockActionContext<InputPropertyMap>({ propsValue });
  return asanaCreateTaskAction.run({
    ...base,
    auth: {
      type: AppConnectionType.OAUTH2,
      access_token: 'token',
      client_id: 'client',
      client_secret: 'secret',
      redirect_url: 'https://example.com/redirect',
      token_type: 'Bearer',
      token_url: 'https://app.asana.com/-/oauth_token',
      scope: 'default',
      claimed_at: 0,
      refresh_token: 'refresh',
      data: {},
    },
    propsValue,
  });
}

function postedTask(sendRequest: ReturnType<typeof mockAsana>): unknown {
  const post = sendRequest.mock.calls.find(([request]) => request.url === TASKS_URL);
  return post?.[0].body;
}

describe('asanaCreateTaskAction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a plain date as an all-day due_on', async () => {
    const sendRequest = mockAsana({ tags: [] });

    await runCreateTask({ due_on: ' 2026-12-31 ' });

    const body = postedTask(sendRequest);
    expect(body).toEqual({ data: expect.objectContaining({ due_on: '2026-12-31' }) });
    expect(body).not.toEqual({ data: expect.objectContaining({ due_at: expect.anything() }) });
  });

  it('sends a date with a time as due_at', async () => {
    const sendRequest = mockAsana({ tags: [] });

    await runCreateTask({ due_on: '2026-12-31T14:00:00Z' });

    const body = postedTask(sendRequest);
    expect(body).toEqual({ data: expect.objectContaining({ due_at: '2026-12-31T14:00:00.000Z' }) });
    expect(body).not.toEqual({ data: expect.objectContaining({ due_on: expect.anything() }) });
  });

  it('sends no due date when the field is empty', async () => {
    const sendRequest = mockAsana({ tags: [] });

    await runCreateTask({ due_on: '' });

    const body = postedTask(sendRequest);
    expect(body).not.toEqual({ data: expect.objectContaining({ due_on: expect.anything() }) });
    expect(body).not.toEqual({ data: expect.objectContaining({ due_at: expect.anything() }) });
  });

  it.each(['next friday', '2026-13-45'])('fails on "%s" before creating the task', async (value) => {
    const sendRequest = mockAsana({ tags: [] });

    await expect(runCreateTask({ due_on: value })).rejects.toThrow(/Due Date/);

    expect(postedTask(sendRequest)).toBeUndefined();
  });

  it('resolves tag names to their gids, ignoring case', async () => {
    const sendRequest = mockAsana({ tags: [{ gid: '555', name: 'Urgent' }] });

    await runCreateTask({ tags: ['urgent'] });

    expect(postedTask(sendRequest)).toEqual({ data: expect.objectContaining({ tags: ['555'] }) });
  });

  it('stops the step when a tag name does not exist', async () => {
    const sendRequest = mockAsana({ tags: [{ gid: '555', name: 'Urgent' }] });

    await expect(runCreateTask({ tags: ['Someday'] })).rejects.toThrow(/No tag named "Someday"/);

    expect(postedTask(sendRequest)).toBeUndefined();
  });
});
