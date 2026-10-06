import { generateKeyPairSync } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mint = vi.hoisted(() => vi.fn<() => Promise<string>>());

vi.mock('../../../src/lib/common/service-account', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/service-account')>();
  return { ...actual, mintServiceAccountToken: mint };
});

const { connectionLocation, normalizeLocation, normalizeProjectId, resolveAuth } = await import('../../../src/lib/common/token');

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const KEY_FILE = JSON.stringify({ type: 'service_account', project_id: 'key-project', client_email: 'bot@key-project.iam.gserviceaccount.com', private_key: privateKey });

beforeEach(() => {
  mint.mockReset();
  mint.mockResolvedValue('ya29.sa');
});

describe('normalizeLocation() / normalizeProjectId()', () => {
  it('should lowercase and trim locations, defaulting to us', () => {
    expect(normalizeLocation(' EU ')).toBe('eu');
    expect(normalizeLocation(undefined)).toBe('us');
    expect(() => normalizeLocation('US East')).toThrow('Invalid location');
  });

  it('should accept project ids and numbers and reject garbage', () => {
    expect(normalizeProjectId(' my-project-123 ')).toBe('my-project-123');
    expect(normalizeProjectId('123456789012')).toBe('123456789012');
    expect(() => normalizeProjectId('')).toThrow('no Google Cloud project ID');
    expect(() => normalizeProjectId('my project')).toThrow('Invalid project ID');
  });
});

describe('resolveAuth()', () => {
  it('should mint a token for a service account connection and read the project from the key', async () => {
    const resolved = await resolveAuth({ type: 'CUSTOM_AUTH', props: { keyFile: KEY_FILE, location: 'EU' } } as never);

    expect(resolved).toEqual({ accessToken: 'ya29.sa', projectId: 'key-project', location: 'eu' });
    expect(mint).toHaveBeenCalledWith({ key: expect.objectContaining({ clientEmail: 'bot@key-project.iam.gserviceaccount.com' }), scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  });

  it('should let the connection override the project of the key', async () => {
    const resolved = await resolveAuth({ type: 'CUSTOM_AUTH', props: { keyFile: KEY_FILE, location: 'us', projectId: 'other' } } as never);
    expect(resolved.projectId).toBe('other');
  });

  it('should pass an OAuth2 token through with its project and location props', async () => {
    const resolved = await resolveAuth({ type: 'OAUTH2', access_token: 'ya29.user', props: { projectId: 'oauth-project', location: 'us' } } as never);

    expect(resolved).toEqual({ accessToken: 'ya29.user', projectId: 'oauth-project', location: 'us' });
    expect(mint).not.toHaveBeenCalled();
  });

  it('should refuse a missing connection, a token-less OAuth connection and an OAuth connection without project', async () => {
    await expect(resolveAuth(undefined)).rejects.toThrow('connection is required');
    await expect(resolveAuth({ type: 'OAUTH2', props: { projectId: 'p' } } as never)).rejects.toThrow('no access token');
    await expect(resolveAuth({ type: 'OAUTH2', access_token: 't', props: { location: 'us' } } as never)).rejects.toThrow('no Google Cloud project ID');
  });
});

describe('connectionLocation()', () => {
  it('should read the location of either connection type without validating it', () => {
    expect(connectionLocation({ type: 'CUSTOM_AUTH', props: { keyFile: '{}', location: 'EU' } } as never)).toBe('EU');
    expect(connectionLocation({ type: 'OAUTH2', access_token: 't', props: { projectId: 'p', location: 'eu' } } as never)).toBe('eu');
    expect(connectionLocation({ type: 'OAUTH2', access_token: 't', props: { location: 42 } } as never)).toBeUndefined();
    expect(connectionLocation(undefined)).toBeUndefined();
  });
});
