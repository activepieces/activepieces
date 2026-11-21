import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { joggAi } from '../src/index';
import { aiCreateProduct } from '../src/lib/actions/ai/create-product';

function run({ props }: { props: Record<string, unknown> }): Promise<unknown> {
  const fn: unknown = aiCreateProduct.run;
  if (typeof fn !== 'function') throw new Error('not a function');
  return Promise.resolve(Reflect.apply(fn, aiCreateProduct, [{ auth: { secret_text: 'k' }, propsValue: props }]));
}

function mockOk() {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
    status: 200,
    headers: {},
    body: { code: 0, msg: 'Success', data: { product_id: 'P1' } },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ai_create_product media', () => {
  it('is registered on the piece', () => {
    expect(Object.keys(joggAi.actions())).toContain('ai_create_product');
  });

  it('requires at least 3 media URLs without a product URL and does not call JoggAI', async () => {
    const spy = mockOk();
    await expect(
      run({ props: { name: 'Mug', media_urls: ['https://res-intl.jogg.ai/a.jpg', 'https://res-intl.jogg.ai/b.jpg'] } })
    ).rejects.toThrow('at least 3 media URLs; 2 given');
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps video extensions to type 2 and others to type 1', async () => {
    const spy = mockOk();
    const out = await run({
      props: {
        name: 'Mug',
        media_urls: ['https://res-intl.jogg.ai/x/a.JPG', 'https://res-intl.jogg.ai/x/b.mp4', 'https://res-intl.jogg.ai/x/c.webm?sig=1'],
      },
    });
    expect(out).toEqual({ product_id: 'P1' });
    const body = spy.mock.calls[0][0].body;
    expect(body).toMatchObject({
      name: 'Mug',
      media: [
        { type: 1, name: 'a.JPG', url: 'https://res-intl.jogg.ai/x/a.JPG' },
        { type: 2, name: 'b.mp4' },
        { type: 2, name: 'c.webm' },
      ],
    });
  });

  it('rejects non-http media URLs', async () => {
    mockOk();
    await expect(
      run({ props: { name: 'Mug', media_urls: ['ftp://h/a.jpg', 'https://h/b.jpg', 'https://h/c.jpg'] } })
    ).rejects.toThrow('Media URL 1 must start with http:// or https://.');
    await expect(
      run({ props: { name: 'Mug', media_urls: ['not a url', 'https://h/b.jpg', 'https://h/c.jpg'] } })
    ).rejects.toThrow('Media URL 1 is not a valid URL.');
  });

  it('allows a product URL without media', async () => {
    const spy = mockOk();
    await run({ props: { url: 'https://shop.example/p' } });
    expect(spy.mock.calls[0][0].body).toEqual({ url: 'https://shop.example/p' });
  });

  it('explains the JoggAI-hosted media requirement on 10400 media.url errors', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { code: 10400, msg: 'The media.url is not a valid URL' },
    });
    await expect(
      run({ props: { name: 'Mug', media_urls: ['https://upload.wikimedia.org/a.jpg', 'https://h/b.jpg', 'https://h/c.jpg'] } })
    ).rejects.toThrow('Upload the files with Upload Media first');
  });

  it('accepts media URLs given as a JSON string or a comma/newline-separated string', async () => {
    const spy = mockOk();
    await run({ props: { name: 'Mug', media_urls: '["https://h/a.jpg","https://h/b.jpg","https://h/c.mp4"]' } });
    await run({ props: { name: 'Mug', media_urls: 'https://h/a.jpg, https://h/b.jpg\nhttps://h/c.mp4' } });
    for (const call of spy.mock.calls) {
      expect(call[0].body).toMatchObject({
        media: [{ name: 'a.jpg', type: 1 }, { name: 'b.jpg', type: 1 }, { name: 'c.mp4', type: 2 }],
      });
    }
  });

  it('rejects invalid media input with a clear message', async () => {
    const spy = mockOk();
    await expect(run({ props: { name: 'Mug', media_urls: '[not json' } })).rejects.toThrow('Media URLs must be a JSON list of URLs');
    await expect(run({ props: { name: 'Mug', media_urls: 5 } })).rejects.toThrow('Media URLs must be a list of URLs.');
    expect(spy).not.toHaveBeenCalled();
  });
});
