import { AuthenticationType, HttpMethod } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser } from '../src/lib/actions/get-current-user';
import { readRepoFile } from '../src/lib/actions/read-repo-file';
import { searchModels } from '../src/lib/actions/search-models';
import { hfHub } from '../src/lib/common/hub-client';
import { hfRepo } from '../src/lib/common/repo';
import { StaticPropsValue } from '@activepieces/pieces-framework';
import { runAction, streamOf, TEST_TOKEN } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

function readFile(overrides: Partial<StaticPropsValue<typeof readRepoFile.props>>) {
  return runAction({
    action: readRepoFile,
    propsValue: {
      repo_type: 'model',
      repo_id: 'openai-community/gpt2',
      path: 'README.md',
      revision: undefined,
      ...overrides,
    },
  });
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('Link header pagination', () => {
  it('extracts the next cursor from a rel="next" Link header', () => {
    const headers = {
      link: '<https://huggingface.co/api/models?limit=2&cursor=eyJwYWdlIjoyfQ%3D%3D>; rel="next"',
    };

    expect(hfHub.parseNextCursor(headers)).toBe('eyJwYWdlIjoyfQ==');
  });

  it('returns null when there is no next link', () => {
    expect(hfHub.parseNextCursor({})).toBeNull();
    expect(hfHub.parseNextCursor(undefined)).toBeNull();
    expect(hfHub.parseNextCursor({ link: '<https://huggingface.co/api/models?cursor=abc>; rel="prev"' })).toBeNull();
  });

  it('reads other query params from the next link', () => {
    const headers = { link: '<https://huggingface.co/api/models/a/b/commits/main?p=3>; rel="next"' };

    expect(hfHub.parseNextLinkParam({ headers, param: 'p' })).toBe('3');
  });

  it('surfaces next_cursor on a search action and forwards the cursor', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: { link: '<https://huggingface.co/api/models?cursor=next123>; rel="next"' },
      body: [{ id: 'openai/gpt-oss-20b' }],
    });

    const result = await runAction({
      action: searchModels,
      propsValue: {
        search: 'gpt',
        author: undefined,
        filter: undefined,
        pipeline_tag: undefined,
        inference_provider: undefined,
        sort: undefined,
        limit: 1,
        full: undefined,
        cursor: 'prev456',
      },
    });

    expect(result).toMatchObject({ next_cursor: 'next123' });
    const url = new URL(sendRequest.mock.calls[0][0].url);
    expect(url.searchParams.get('cursor')).toBe('prev456');
  });
});

describe('repository id and revision encoding', () => {
  it('encodes each id segment separately and keeps the slash', () => {
    expect(hfRepo.encodeRepoId('my org/my model')).toBe('my%20org/my%20model');
    expect(hfRepo.encodeRepoId('/openai-community/gpt2/')).toBe('openai-community/gpt2');
  });

  it('rejects ids with more than two segments', () => {
    expect(() => hfRepo.encodeRepoId('a/b/c')).toThrow(/Invalid repository ID/);
  });

  it('encodes a PR ref as one path segment and defaults to main', () => {
    expect(hfRepo.encodeRevision('refs/pr/1')).toBe('refs%2Fpr%2F1');
    expect(hfRepo.encodeRevision(undefined)).toBe('main');
    expect(hfRepo.encodeRevision('  ')).toBe('main');
  });

  it('encodes file path segments but keeps folder separators', () => {
    expect(hfRepo.encodeFilePath('configs/my file#1.json')).toBe('configs/my%20file%231.json');
  });

  it('resolves a legacy single-segment id through the Hub API', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'openai-community/gpt2' } });

    const canonical = await hfRepo.resolveRepoId({ token: TEST_TOKEN, repoType: 'model', repoId: 'gpt2' });

    expect(canonical).toBe('openai-community/gpt2');
    expect(sendRequest.mock.calls[0][0].url).toBe('https://huggingface.co/api/models/gpt2');
  });
});

describe('read_repo_file', () => {
  it('builds the resolve URL with encoded id, revision and path', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: streamOf('# Hi') });

    const result = await readFile({
      repo_type: 'dataset',
      repo_id: 'my org/data',
      revision: 'refs/pr/1',
      path: 'docs/read me.md',
    });

    const expectedUrl = 'https://huggingface.co/datasets/my%20org/data/resolve/refs%2Fpr%2F1/docs/read%20me.md';
    expect(sendRequest.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.GET,
      url: expectedUrl,
      followRedirects: false,
      responseType: 'stream',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: TEST_TOKEN },
    });
    expect(result).toEqual({
      repo_type: 'dataset',
      repo_id: 'my org/data',
      revision: 'refs/pr/1',
      path: 'docs/read me.md',
      content: '# Hi',
      size_bytes: 4,
      url: expectedUrl,
    });
  });

  it('keeps Authorization on a same-host redirect and drops it on a cross-host redirect', async () => {
    sendRequest
      .mockResolvedValueOnce({
        status: 307,
        headers: { location: '/api/resolve-cache/models/openai-community/gpt2/abc/README.md' },
        body: streamOf(''),
      })
      .mockResolvedValueOnce({
        status: 302,
        headers: { location: 'https://cas-bridge.xethub.hf.co/xet-bridge/abc?X-Amz-Signature=sig' },
        body: streamOf(''),
      })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: streamOf('hello') });

    const result = await readFile({});

    expect(sendRequest).toHaveBeenCalledTimes(3);
    const [first, second, third] = sendRequest.mock.calls.map((call) => call[0]);
    expect(first.authentication).toEqual({ type: AuthenticationType.BEARER_TOKEN, token: TEST_TOKEN });
    expect(second.url).toBe('https://huggingface.co/api/resolve-cache/models/openai-community/gpt2/abc/README.md');
    expect(second.authentication).toEqual({ type: AuthenticationType.BEARER_TOKEN, token: TEST_TOKEN });
    expect(third.url).toBe('https://cas-bridge.xethub.hf.co/xet-bridge/abc?X-Amz-Signature=sig');
    expect(third.authentication).toBeUndefined();
    expect(JSON.stringify(third)).not.toContain(TEST_TOKEN);
    expect(result).toMatchObject({ content: 'hello', size_bytes: 5 });
  });

  it('fails with FILE_TOO_LARGE from the redirect x-linked-size before following it', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 302,
      headers: { location: 'https://cdn-lfs.hf.co/file', 'x-linked-size': String(5 * 1024 * 1024) },
      body: streamOf(''),
    });

    await expect(readFile({ path: 'model.safetensors' })).rejects.toThrow(/^FILE_TOO_LARGE: the file is 5242880 bytes/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('fails with FILE_TOO_LARGE from content-length', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: { 'content-length': String(hfHub.maxTextFileBytes + 1) },
      body: streamOf('x'),
    });

    await expect(readFile({})).rejects.toThrow(/^FILE_TOO_LARGE/);
  });

  it('fails with FILE_TOO_LARGE when an unsized stream exceeds the cap', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: streamOf(Buffer.alloc(hfHub.maxTextFileBytes + 1, 97)),
    });

    await expect(readFile({})).rejects.toThrow(/^FILE_TOO_LARGE: the file is more than/);
  });

  it('fails with BINARY_FILE for content with NUL bytes', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: streamOf(Buffer.from([0x50, 0x4b, 0x00, 0x03])) });

    await expect(readFile({ path: 'weights.bin' })).rejects.toThrow(/^BINARY_FILE/);
  });

  it('fails with BINARY_FILE for invalid UTF-8', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: streamOf(Buffer.from([0xff, 0xfe, 0x41])) });

    await expect(readFile({})).rejects.toThrow(/^BINARY_FILE/);
  });

  it('stops after too many redirects', async () => {
    sendRequest.mockImplementation(async () => ({
      status: 302,
      headers: { location: 'https://huggingface.co/loop' },
      body: streamOf(''),
    }));

    await expect(readFile({})).rejects.toThrow(/Too many redirects/);
  });

  it('rejects an empty file path without a request', async () => {
    await expect(readFile({ path: '//' })).rejects.toThrow(/File Path is required/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('get_current_user', () => {
  it('returns token metadata but never token material', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: {
        name: 'odai',
        fullname: 'Odai',
        type: 'user',
        orgs: [{ name: 'acme', fullname: 'Acme', roleInOrg: 'admin', isEnterprise: false }],
        auth: {
          type: 'access_token',
          accessToken: {
            displayName: 'automation',
            role: 'fineGrained',
            createdAt: '2026-01-02T03:04:05.000Z',
            token: 'hf_leaked_value_from_api',
            fineGrained: {
              canReadGatedRepos: true,
              global: ['inference.serverless.write'],
              scoped: [{ entity: { type: 'user', name: 'odai' }, permissions: ['repo.content.read'] }],
            },
          },
        },
      },
    });

    const result = await runAction({ action: getCurrentUser, propsValue: {} });

    expect(sendRequest.mock.calls[0][0].url).toBe('https://huggingface.co/api/whoami-v2');
    expect(result).toMatchObject({
      username: 'odai',
      token_name: 'automation',
      token_role: 'fineGrained',
      token_created_at: '2026-01-02T03:04:05.000Z',
      token_can_read_gated_repos: true,
      token_global_permissions: ['inference.serverless.write'],
      organizations: [{ name: 'acme', role_in_org: 'admin' }],
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('hf_leaked_value_from_api');
    expect(serialized).not.toContain(TEST_TOKEN);
    expect(result).not.toHaveProperty('token');
    expect(result).not.toHaveProperty('access_token');
  });
});
