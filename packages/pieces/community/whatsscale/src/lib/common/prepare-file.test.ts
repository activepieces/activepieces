import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareFile } from './prepare-file';
import * as clientModule from './client';

vi.mock('./client', () => ({
  whatsscaleClient: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('prepareFile', () => {
  it('calls POST /make/prepareFile with correct fileUrl in body', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { url: 'https://proxy.whatsscale.com/files/prepared.jpg' },
    } as any);

    await prepareFile('test-api-key', 'https://example.com/image.jpg');

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/make/prepareFile',
      { fileUrl: 'https://example.com/image.jpg' },
    );
  });

  it('sends correct API key via whatsscaleClient', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { url: 'https://proxy.whatsscale.com/files/prepared.jpg' },
    } as any);

    await prepareFile('my-secret-key', 'https://example.com/image.jpg');

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'my-secret-key',
      expect.any(String),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('returns the prepared URL string from response.body.url', async () => {
    const preparedUrl = 'https://proxy.whatsscale.com/files/abc123.jpg';
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { url: preparedUrl },
    } as any);

    const result = await prepareFile('test-api-key', 'https://example.com/image.jpg');

    expect(result).toBe(preparedUrl);
  });

  it('throws when proxy returns 400', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockRejectedValueOnce(
      new Error('Bad Request: invalid file URL'),
    );

    await expect(
      prepareFile('test-api-key', 'https://example.com/bad-file'),
    ).rejects.toThrow('Bad Request: invalid file URL');
  });

  it('throws when proxy returns 500', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockRejectedValueOnce(
      new Error('Internal Server Error'),
    );

    await expect(
      prepareFile('test-api-key', 'https://example.com/image.jpg'),
    ).rejects.toThrow('Internal Server Error');
  });
});
