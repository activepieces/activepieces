import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError } from '@activepieces/pieces-common';
import { generateAltTextAction } from '../src/lib/actions/generate-alt-text';

function runGenerate({ props }: { props: Record<string, unknown> }) {
  const context = { auth: { secret_text: 'key' }, propsValue: props };
  return Reflect.apply(generateAltTextAction.run, undefined, [context]);
}

function mockSend() {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
    status: 200,
    headers: {},
    body: { asset_id: 'abc', alt_text: 'A dog', created_at: '2025-03-21T08:39:29.751Z' },
  });
}

describe('generate-alt-text', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('routes a URL to /image/url with only the set keys', async () => {
    const send = mockSend();
    const output = await runGenerate({
      props: { image_url: ' https://x.test/a.jpg ', lang: 'fr', keywords: ['dog', '', '  '], negative_keywords: [] },
    });
    const request = send.mock.calls[0][0];
    expect(request.url).toBe('https://api.alttextify.net/api/v1/image/url');
    expect(request.headers).toMatchObject({ 'X-API-Key': 'key' });
    expect(request.body).toEqual({ async: false, image: 'https://x.test/a.jpg', lang: 'fr', keywords: ['dog'] });
    expect(output).toMatchObject({ asset_id: 'abc', alt_text: 'A dog' });
  });

  it('routes a file to /image/raw with a data URI and snake_case keys', async () => {
    const send = mockSend();
    await runGenerate({
      props: {
        image: { base64: 'AAA', extension: 'png', filename: 'a.png' },
        max_chars: 60,
        asset_id: 'my-id',
        start_with: 'Photo of',
        end_with: '.',
        domain_context: 'pets',
        run_ocr: 'no',
        product_name: 'Leash',
        product_brand: 'Acme',
      },
    });
    const request = send.mock.calls[0][0];
    expect(request.url).toBe('https://api.alttextify.net/api/v1/image/raw');
    expect(request.body).toEqual({
      async: false,
      image: 'data:image/png;base64,AAA',
      max_chars: 60,
      asset_id: 'my-id',
      start_with: 'Photo of',
      end_with: '.',
      domain_context: 'pets',
      ecommerce: { run_ocr: false, product: { name: 'Leash', brand: 'Acme' } },
    });
  });

  it('omits ecommerce when nothing is set', async () => {
    const send = mockSend();
    await runGenerate({ props: { image_url: 'https://x.test/a.jpg', product_name: '  ' } });
    expect(send.mock.calls[0][0].body).not.toHaveProperty('ecommerce');
  });

  it('requires exactly one image source', async () => {
    const send = mockSend();
    await expect(runGenerate({ props: {} })).rejects.toThrow('Fill Image File or Image URL.');
    await expect(
      runGenerate({ props: { image_url: 'https://x.test/a.jpg', image: { base64: 'AAA' } } }),
    ).rejects.toThrow('not both');
    expect(send).not.toHaveBeenCalled();
  });

  it('joins an array alt_text into one string', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { asset_id: 'abc', alt_text: ['A', 'B'] },
    });
    const output = await runGenerate({ props: { image_url: 'https://x.test/a.jpg' } });
    expect(output).toMatchObject({ alt_text: 'A\nB', created_at: null });
  });

  it('hints at the extension rule on a 400 for a URL without an image extension', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 400, responseBody: { error: { message: 'Invalid image format.', code: 'FST_ERR_VALIDATION' } } }),
    );
    await expect(
      runGenerate({ props: { image_url: 'https://images.unsplash.com/photo-1?fm=jpg' } }),
    ).rejects.toThrow('does not end in an image extension');
  });

  it('trims start_with and end_with', async () => {
    const send = mockSend();
    await runGenerate({ props: { image_url: 'https://x.test/a.jpg', start_with: ' Photo ', end_with: '   ' } });
    expect(send.mock.calls[0][0].body).toMatchObject({ start_with: 'Photo' });
    expect(send.mock.calls[0][0].body).not.toHaveProperty('end_with');
  });

  it('resolves the stored record id from the job response', async () => {
    const send = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: { asset_id: 'job1', alt_text: 'A dog', created_at: '2025-03-21T08:39:29.751Z' },
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: [
          { asset_id: 'other', alt_text: ['A cat'], created_at: '2025-03-21T08:39:29.900Z' },
          { asset_id: 'real1', alt_text: ['A dog'], created_at: '2025-03-21T08:39:30.500Z' },
        ],
      });
    const output = await runGenerate({ props: { image: { base64: 'AAA', extension: 'png' } } });
    expect(send.mock.calls[1][0].queryParams).toEqual({ page: '1', limit: '10' });
    expect(output).toEqual({
      asset_id: 'real1',
      job_id: 'job1',
      alt_text: 'A dog',
      created_at: '2025-03-21T08:39:30.500Z',
      note: null,
    });
  });

  it('falls back to the job id with a note when no record matches', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: { asset_id: 'job1', alt_text: 'A dog', created_at: '2025-03-21T08:39:29.751Z' },
      })
      .mockRejectedValueOnce(new Error('network down'));
    const output = await runGenerate({ props: { image_url: 'https://x.test/a.jpg' } });
    expect(output).toMatchObject({ asset_id: 'job1', job_id: 'job1' });
    expect(output.note).toContain('Could not find');
  });

  it('rejects a file over 15 MB before calling AltTextify', async () => {
    const send = mockSend();
    const base64 = 'A'.repeat(Math.ceil((15 * 1024 * 1024 * 4) / 3) + 8);
    await expect(runGenerate({ props: { image: { base64, extension: 'png' } } })).rejects.toThrow('larger than 15 MB');
    expect(send).not.toHaveBeenCalled();
  });

  it('notes a time-only match when the alt text differs', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: { asset_id: 'job1', alt_text: 'A dog', created_at: '2025-03-21T08:39:29.751Z' },
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: [{ asset_id: 'near', alt_text: ['Something else'], created_at: '2025-03-21T08:39:40.000Z' }],
      });
    const output = await runGenerate({ props: { image_url: 'https://x.test/a.jpg' } });
    expect(output).toMatchObject({ asset_id: 'near', job_id: 'job1' });
    expect(output.note).toContain('Matched the stored image by time only');
  });
});
