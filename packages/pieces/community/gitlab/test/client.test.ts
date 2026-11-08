import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  encodeSegment,
  gitlabListPage,
  gitlabRequest,
  projectPath,
} from '../src/lib/common/client';
import { GITLAB_API_BASE } from '../src/lib/common/constants';
import {
  listProjectOptions,
  gitlabCommon,
  PROJECT_DROPDOWN_PAGE_CAP,
} from '../src/lib/common';
import {
  buildGitlabUrl,
  GitlabApiError,
  sendGitlabRequest,
} from '../src/lib/common/secret-request';
import { auth, FAKE_DISPATCHER, stubGitlab } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('base URL and path encoding', () => {
  it('keeps the API base in one constant', () => {
    expect(GITLAB_API_BASE).toBe('https://gitlab.com/api/v4');
  });

  it('encodes a project path so group/project stays one segment', () => {
    expect(projectPath('my-group/sub group/proj')).toBe(
      '/projects/my-group%2Fsub%20group%2Fproj'
    );
    expect(projectPath(42)).toBe('/projects/42');
  });

  it('refuses empty and dot segments', () => {
    expect(() => encodeSegment({ value: '  ', label: 'Branch' })).toThrow(
      'Branch is required.'
    );
    expect(() => encodeSegment({ value: '..', label: 'Branch' })).toThrow(
      'Branch is not valid.'
    );
  });

  it('builds URLs only on the GitLab host and refuses traversal or protocol-relative paths', () => {
    expect(
      buildGitlabUrl({
        path: '/projects/1',
        query: { a: 'x', b: undefined, c: '', d: [1, 2] },
      })
    ).toBe('https://gitlab.com/api/v4/projects/1?a=x&d%5B%5D=1&d%5B%5D=2');
    expect(() => buildGitlabUrl({ path: '//evil.io/x' })).toThrow();
    expect(() => buildGitlabUrl({ path: '/projects/../../x' })).toThrow();
    expect(() => buildGitlabUrl({ path: 'projects' })).toThrow();
  });
});

describe('transport', () => {
  it('sends bearer auth, JSON, no redirect following and the verified TLS dispatcher', async () => {
    const seen = stubGitlab([{ body: { id: 1 } }]);
    await gitlabRequest({
      auth,
      method: 'POST',
      path: '/projects/1/issues',
      body: { title: 'x' },
    });
    expect(seen[0].headers.get('authorization')).toBe('Bearer TOKEN-123');
    expect(seen[0].headers.get('content-type')).toBe('application/json');
    expect(seen[0].redirect).toBe('manual');
    expect(seen[0].dispatcher).toBe(FAKE_DISPATCHER);
  });

  it('maps errors to GitlabApiError with status, responseBody and the vendor message', async () => {
    stubGitlab([{ status: 404, body: { message: '404 Project Not Found' } }]);
    const error = await gitlabRequest({
      auth,
      method: 'GET',
      path: '/projects/1',
    }).catch((e) => e);
    expect(error).toBeInstanceOf(GitlabApiError);
    expect(error.status).toBe(404);
    expect(error.responseBody).toEqual({ message: '404 Project Not Found' });
    expect(error.message).toContain('404 Project Not Found');
    expect(error).not.toHaveProperty('body');
  });

  it('uses an action-specific message for a named status', async () => {
    stubGitlab([
      {
        status: 409,
        body: { message: ['Another open merge request already exists'] },
      },
    ]);
    await expect(
      gitlabRequest({
        auth,
        method: 'POST',
        path: '/x',
        statusMessages: { 409: 'Duplicate MR' },
      })
    ).rejects.toThrow(
      /Duplicate MR \(HTTP 409\): \["Another open merge request already exists"\]/
    );
  });

  it('does not follow redirects', async () => {
    stubGitlab([{ status: 302, headers: { location: 'https://evil.io/' } }]);
    await expect(
      sendGitlabRequest({ token: 't', method: 'GET', path: '/user' })
    ).rejects.toThrow(/redirect/);
  });

  it('returns undefined for 204', async () => {
    stubGitlab([{ status: 204 }]);
    expect(
      await gitlabRequest({ auth, method: 'DELETE', path: '/x' })
    ).toBeUndefined();
  });
});

describe('list paging', () => {
  it('reads nextPage from x-next-page only and never follows Link', async () => {
    const seen = stubGitlab([
      {
        body: [{ id: 1 }],
        headers: {
          'x-next-page': '3',
          'x-total': '41',
          link: '<https://evil.io/api/v4/projects?page=3>; rel="next"',
        },
      },
    ]);
    const page = await gitlabListPage({
      auth,
      path: '/projects',
      page: 2,
      perPage: 20,
    });
    expect(page).toEqual({
      items: [{ id: 1 }],
      count: 1,
      page: 2,
      nextPage: 3,
      hasMore: true,
      total: 41,
    });
    expect(seen).toHaveLength(1);
    expect(seen[0].query).toMatchObject({ page: '2', per_page: '20' });
  });

  it('treats a missing x-total and an empty x-next-page as the last page', async () => {
    stubGitlab([{ body: [], headers: { 'x-next-page': '' } }]);
    const page = await gitlabListPage({ auth, path: '/projects' });
    expect(page).toMatchObject({
      page: 1,
      nextPage: null,
      hasMore: false,
      total: null,
    });
  });
});

describe('project dropdown', () => {
  it('pages with per_page 100 and stops at the page cap', async () => {
    const seen = stubGitlab((request) => ({
      body: [
        {
          id: Number(request.query['page']),
          name: 'p',
          name_with_namespace: `g / p${request.query['page']}`,
        },
      ],
      headers: { 'x-next-page': String(Number(request.query['page']) + 1) },
    }));
    const result = await listProjectOptions({ auth });
    expect(seen).toHaveLength(PROJECT_DROPDOWN_PAGE_CAP);
    expect(seen[0].query).toMatchObject({
      per_page: '100',
      membership: 'true',
      simple: 'true',
    });
    expect(result.truncated).toBe(true);
    expect(result.options[0]).toEqual({ label: 'g / p1', value: 1 });
  });

  it('passes the search text to GitLab', async () => {
    const seen = stubGitlab([{ body: [{ id: 5, name: 'api' }] }]);
    const prop = gitlabCommon.projectId();
    const state = await Reflect.apply(prop.options, prop, [
      { auth },
      { searchValue: 'api' },
    ]);
    expect(seen[0].query['search']).toBe('api');
    expect(state).toMatchObject({
      disabled: false,
      options: [{ label: 'api', value: 5 }],
    });
  });

  it('returns a disabled state with the reason when GitLab fails', async () => {
    stubGitlab([{ status: 401, body: { message: '401 Unauthorized' } }]);
    const prop = gitlabCommon.projectId();
    const state = await Reflect.apply(prop.options, prop, [{ auth }, {}]);
    expect(state.disabled).toBe(true);
    expect(state.placeholder).toContain('401');
  });
});
