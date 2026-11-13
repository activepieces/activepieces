import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AppConnectionType,
  createMockActionContext,
  InputPropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { githubUpdateRepositoryAction } from '../src/lib/actions/ai/update-repository';
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

function runUpdate(propsValue: Record<string, unknown>) {
  apiCall.mockResolvedValueOnce({ status: 200, headers: {}, body: {} });
  const fullPropsValue = { owner: 'octo', repo: 'repo', ...propsValue };
  return githubUpdateRepositoryAction.run({
    ...createMockActionContext<InputPropertyMap>({ propsValue: fullPropsValue }),
    auth,
    propsValue: fullPropsValue,
  });
}

function sentBody() {
  return apiCall.mock.calls[0][0].body;
}

describe('githubUpdateRepositoryAction', () => {
  afterEach(() => {
    apiCall.mockReset();
  });

  test('has no optional Checkbox, which the agent path would fill with false', () => {
    const optionalCheckboxes = Object.entries(githubUpdateRepositoryAction.props)
      .filter(([, prop]) => prop.type === PropertyType.CHECKBOX && !prop.required)
      .map(([name]) => name);

    expect(optionalCheckboxes).toEqual([]);
  });

  test('a description-only update leaves visibility, Issues and archive state out of the request', async () => {
    await runUpdate({ description: 'New description' });

    expect(apiCall.mock.calls[0][0].resourceUri).toBe('/repos/octo/repo');
    expect(sentBody()).toEqual({ description: 'New description' });
  });

  test('Leave unchanged sends nothing for that field', async () => {
    await runUpdate({
      description: 'New description',
      private: 'unchanged',
      has_issues: 'unchanged',
      archived: 'unchanged',
    });

    expect(sentBody()).toEqual({ description: 'New description' });
  });

  test('Yes and No send true and false', async () => {
    await runUpdate({ private: 'yes', has_issues: 'no', archived: 'no' });

    expect(sentBody()).toEqual({
      private: true,
      has_issues: false,
      archived: false,
    });
  });

  test('booleans saved by older versions still map to true and false', async () => {
    await runUpdate({ private: true, has_issues: false, archived: true });

    expect(sentBody()).toEqual({
      private: true,
      has_issues: false,
      archived: true,
    });
  });
});
