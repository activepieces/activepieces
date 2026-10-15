import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commitFiles } from '../src/lib/actions/commit-files';
import { updateWebhook } from '../src/lib/actions/update-webhook';
import { runAction } from './helpers';

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

const WEBHOOK_ID = '6390e855e30d9209411de93b';

function webhook(overrides: Record<string, unknown>) {
  return {
    id: WEBHOOK_ID,
    url: 'https://example.com/hook',
    disabled: false,
    watched: [{ type: 'model', name: 'openai-community/gpt2' }],
    domains: ['repo'],
    hasSecret: true,
    ...overrides,
  };
}

function update({ url, secret }: { url?: string; secret?: string }) {
  return runAction({
    action: updateWebhook,
    propsValue: { webhook_id: WEBHOOK_ID, url, watched: undefined, domains: undefined, secret },
  });
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('update_webhook secret_status', () => {
  it('reports kept, sends no secret and keeps the current watched items and domains', async () => {
    sendRequest
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { webhook: webhook({}) } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { webhook: webhook({ url: 'https://example.com/new' }) } });

    const result = await update({ url: 'https://example.com/new' });

    expect(result).toMatchObject({ url: 'https://example.com/new', has_secret: true, secret_status: 'kept', warning: null });
    expect(sendRequest.mock.calls[1][0].body).toEqual({
      url: 'https://example.com/new',
      watched: [{ type: 'model', name: 'openai-community/gpt2' }],
      domains: ['repo'],
    });
  });

  it('reports cleared with a warning when the Hub drops the secret', async () => {
    sendRequest
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { webhook: webhook({}) } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { webhook: webhook({ hasSecret: false }) } });

    const result = await update({ url: 'https://example.com/hook' });

    expect(result).toMatchObject({ has_secret: false, secret_status: 'cleared' });
    expect(result).toHaveProperty('warning', expect.stringContaining('New Secret'));
  });

  it('reports cleared when the response omits hasSecret', async () => {
    const { hasSecret: _omitted, ...withoutSecretField } = webhook({});
    sendRequest
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { webhook: webhook({}) } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { webhook: withoutSecretField } });

    const result = await update({ url: 'https://example.com/hook' });

    expect(result).toMatchObject({ secret_status: 'cleared' });
  });

  it('reports replaced and sends the new secret', async () => {
    sendRequest
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { webhook: webhook({}) } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { webhook: webhook({}) } });

    const result = await update({ secret: 'new-secret' });

    expect(result).toMatchObject({ secret_status: 'replaced', warning: null });
    expect(sendRequest.mock.calls[1][0].body).toMatchObject({ secret: 'new-secret' });
  });
});

describe('commit_files binary check', () => {
  it('refuses base64 content with a NUL byte after the first 8,000 bytes', async () => {
    const content = Buffer.concat([Buffer.from('a'.repeat(9000)), Buffer.from([0]), Buffer.from('b')]).toString('base64');

    await expect(
      runAction({
        action: commitFiles,
        propsValue: {
          repo_type: 'model',
          repo_id: 'user/repo',
          branch: 'main',
          summary: 'Add data',
          commit_description: undefined,
          files: [{ path: 'data.txt', content, encoding: 'base64' }],
          deleted_paths: undefined,
          parent_commit: undefined,
          create_pr: false,
        },
      })
    ).rejects.toThrow(/^LFS_UPLOAD_REQUIRED: 'data.txt' is a binary file/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
