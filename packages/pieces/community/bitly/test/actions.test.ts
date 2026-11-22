import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { archiveBitlinkAction } from '../src/lib/actions/archive-bitlink';
import { createBitlinkAction } from '../src/lib/actions/create-bitlink';
import { createQrCodeAction } from '../src/lib/actions/create-qr-code';
import { getBitlinkClicksAction } from '../src/lib/actions/get-bitlink-clicks';
import { getBitlinkDetailsAction } from '../src/lib/actions/get-bitlink-details';
import { updateBitlinkAction } from '../src/lib/actions/update-bitlink';

const AUTH = { props: { accessToken: 'tok' } };

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

function mockOk({ body = {} }: { body?: unknown } = {}) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('update_bitlink', () => {
  it('does not send archived when only the title changes', async () => {
    const spy = mockOk();
    await run({ action: updateBitlinkAction, propsValue: { bitlink: 'bit.ly/abc', title: 'New' } });
    expect(spy.mock.calls[0][0].body).toEqual({ title: 'New' });
  });

  it('treats a legacy unchecked checkbox (false) as unchanged', async () => {
    const spy = mockOk();
    await run({ action: updateBitlinkAction, propsValue: { bitlink: 'bit.ly/abc', title: 'New', archived: false } });
    expect(spy.mock.calls[0][0].body).toEqual({ title: 'New' });
  });

  it('unarchives on "no" and archives on legacy true', async () => {
    const spy = mockOk();
    await run({ action: updateBitlinkAction, propsValue: { bitlink: 'https://bit.ly/abc', archived: 'no' } });
    await run({ action: updateBitlinkAction, propsValue: { bitlink: 'bit.ly/abc', archived: true } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'PATCH', url: 'https://api-ssl.bitly.com/v4/bitlinks/bit.ly/abc', body: { archived: false } });
    expect(spy.mock.calls[1][0].body).toEqual({ archived: true });
  });

  it('ignores blank-only tags instead of wiping all tags', async () => {
    const spy = mockOk();
    await run({ action: updateBitlinkAction, propsValue: { bitlink: 'bit.ly/abc', title: 'New', tags: ['  ', ''] } });
    expect(spy.mock.calls[0][0].body).toEqual({ title: 'New' });
    await expect(run({ action: updateBitlinkAction, propsValue: { bitlink: 'bit.ly/abc', tags: [' '] } })).rejects.toThrow('No fields');
  });

  it('refuses an empty update without calling Bitly', async () => {
    const spy = mockOk();
    await expect(run({ action: updateBitlinkAction, propsValue: { bitlink: 'bit.ly/abc', tags: [] } })).rejects.toThrow('No fields');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('create_bitlink', () => {
  it('sends the documented body', async () => {
    const spy = mockOk();
    await run({
      action: createBitlinkAction,
      propsValue: { long_url: 'https://example.org/x', group_guid: 'Bg1', domain: 'bit.ly', title: 'T', tags: ['a'], force_new_link: false },
    });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      url: 'https://api-ssl.bitly.com/v4/bitlinks',
      body: { long_url: 'https://example.org/x', group_guid: 'Bg1', domain: 'bit.ly', title: 'T', tags: ['a'] },
    });
  });

  it('rejects a partially filled deeplink before calling Bitly', async () => {
    const spy = mockOk();
    await expect(
      run({ action: createBitlinkAction, propsValue: { long_url: 'https://example.org', group_guid: 'Bg1', app_id: 'com.x' } })
    ).rejects.toThrow('fill Mobile App ID');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects a URL without scheme', async () => {
    await expect(run({ action: createBitlinkAction, propsValue: { long_url: 'example.org', group_guid: 'Bg1' } })).rejects.toThrow('Invalid Long URL');
  });
});

describe('archive / get / clicks', () => {
  it('archive sends archived true to the normalised id', async () => {
    const spy = mockOk();
    await run({ action: archiveBitlinkAction, propsValue: { bitlink: 'https://bit.ly/abc' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'PATCH', url: 'https://api-ssl.bitly.com/v4/bitlinks/bit.ly/abc', body: { archived: true } });
  });

  it('get uses GET on the bitlink path', async () => {
    const spy = mockOk();
    await run({ action: getBitlinkDetailsAction, propsValue: { bitlink: 'bit.ly/abc' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'GET', url: 'https://api-ssl.bitly.com/v4/bitlinks/bit.ly/abc' });
  });

  it('clicks defaults to 30 days', async () => {
    const spy = mockOk({ body: { total_clicks: 3, unit: 'day', units: 30, unit_reference: '2026-11-19T00:00:00+0000' } });
    const out = await run({ action: getBitlinkClicksAction, propsValue: { bitlink: 'bit.ly/abc' } });
    expect(spy.mock.calls[0][0].url).toBe('https://api-ssl.bitly.com/v4/bitlinks/bit.ly/abc/clicks/summary?unit=day&units=30');
    expect(out).toMatchObject({ total_clicks: 3 });
  });

  it('clicks rejects an unknown unit', async () => {
    await expect(run({ action: getBitlinkClicksAction, propsValue: { bitlink: 'bit.ly/abc', unit: 'year' } })).rejects.toThrow('Unit must be');
  });
});

describe('create_qr_code', () => {
  it('sends a typed body and parses string error correction', async () => {
    const spy = mockOk();
    await run({
      action: createQrCodeAction,
      propsValue: {
        group_guid: 'Bg1',
        destination_type: 'bitlink_id',
        destination: { bitlink_id: 'https://bit.ly/abc' },
        title: 'Q',
        corner_1_shape: 'rounded',
        error_correction: '3',
        bitly_brand: false,
      },
    });
    expect(spy.mock.calls[0][0].body).toEqual({
      group_guid: 'Bg1',
      destination: { bitlink_id: 'bit.ly/abc' },
      title: 'Q',
      render_customizations: {
        corners: { corner_1: { shape: 'rounded' } },
        branding: { bitly_brand: false },
        spec_settings: { error_correction: 3 },
      },
    });
  });

  it('still accepts a legacy numeric error correction value', async () => {
    const spy = mockOk();
    await run({
      action: createQrCodeAction,
      propsValue: { group_guid: 'Bg1', destination: { long_url: 'https://example.org' }, error_correction: 2 },
    });
    expect(spy.mock.calls[0][0].body).toMatchObject({ render_customizations: { spec_settings: { error_correction: 2 } } });
  });
});
