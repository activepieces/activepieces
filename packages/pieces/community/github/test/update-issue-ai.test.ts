import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AppConnectionType,
  createMockActionContext,
  InputPropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { githubUpdateIssueAiAction } from '../src/lib/actions/ai/update-issue-ai';
import { githubApiCall } from '../src/lib/common';
import { GithubAuthValue } from '../src/lib/common/auth-helpers';

vi.mock('../src/lib/common', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/common')>();
  return { ...original, githubApiCall: vi.fn() };
});

const apiCall = vi.mocked(githubApiCall);

const auth: GithubAuthValue = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'ghp_test',
};

function agentPathDefaults(): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(githubUpdateIssueAiAction.props)) {
    if (prop.required) continue;
    if (prop.type === PropertyType.ARRAY) defaults[name] = [];
    else if (prop.type === PropertyType.DYNAMIC) defaults[name] = {};
    else if (prop.type === PropertyType.CHECKBOX)
      defaults[name] = prop.defaultValue ?? false;
  }
  return defaults;
}

function runUpdate(propsValue: Record<string, unknown>) {
  apiCall.mockResolvedValueOnce({ status: 200, headers: {}, body: {} });
  const fullPropsValue = {
    owner: 'octo',
    repo: 'repo',
    issue_number: 7,
    ...propsValue,
  };
  return githubUpdateIssueAiAction.run({
    ...createMockActionContext<InputPropertyMap>({ propsValue: fullPropsValue }),
    auth,
    propsValue: fullPropsValue,
  });
}

function sentBody() {
  return apiCall.mock.calls[0][0].body;
}

describe('githubUpdateIssueAiAction', () => {
  afterEach(() => {
    apiCall.mockReset();
  });

  test('a title-only update on the agent path leaves labels and assignees out of the request', async () => {
    await runUpdate({ ...agentPathDefaults(), title: 'New title' });

    expect(apiCall.mock.calls[0][0].resourceUri).toBe('/repos/octo/repo/issues/7');
    expect(sentBody()).toEqual({ title: 'New title' });
  });

  test('empty labels and assignees lists send nothing for those fields', async () => {
    await runUpdate({ title: 'New title', labels: [], assignees: [] });

    expect(sentBody()).toEqual({ title: 'New title' });
  });

  test('labels and assignees with values replace the current set', async () => {
    await runUpdate({ labels: ['bug', 'p1'], assignees: ['octocat'] });

    expect(sentBody()).toEqual({
      labels: ['bug', 'p1'],
      assignees: ['octocat'],
    });
  });

  test('Clear Labels and Clear Assignees send empty lists', async () => {
    await runUpdate({
      ...agentPathDefaults(),
      clear_labels: true,
      clear_assignees: true,
    });

    expect(sentBody()).toEqual({ labels: [], assignees: [] });
  });

  test('Clear Labels and Clear Assignees override the lists', async () => {
    await runUpdate({
      labels: ['bug'],
      assignees: ['octocat'],
      clear_labels: true,
      clear_assignees: true,
    });

    expect(sentBody()).toEqual({ labels: [], assignees: [] });
  });

  test('clearing labels leaves assignees alone', async () => {
    await runUpdate({ ...agentPathDefaults(), clear_labels: true });

    expect(sentBody()).toEqual({ labels: [] });
  });
});
