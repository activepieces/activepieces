import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiCreateQrCodeAction } from '../src/lib/actions/ai/ai-create-qr-code';
import { aiGetBitlinkAction } from '../src/lib/actions/ai/ai-get-bitlink';
import { aiGetBitlinkClicksAction } from '../src/lib/actions/ai/ai-get-bitlink-clicks';
import { aiListGroupsAction } from '../src/lib/actions/ai/ai-list-groups';
import { aiListQrCodesAction } from '../src/lib/actions/ai/ai-list-qr-codes';
import { aiSearchBitlinksAction } from '../src/lib/actions/ai/ai-search-bitlinks';
import { aiShortenUrlAction } from '../src/lib/actions/ai/ai-shorten-url';
import { aiUpdateBitlinkAction } from '../src/lib/actions/ai/ai-update-bitlink';

const AUTH = { props: { accessToken: 'tok' } };
const BASE = 'https://api-ssl.bitly.com/v4';

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

function mockBodies({ bodies }: { bodies: unknown[] }) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) {
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  }
  return spy;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ai actions', () => {
  it('list groups returns guid and plain domain list', async () => {
    mockBodies({ bodies: [{ groups: [{ guid: 'Bg1', name: 'Main', organization_guid: 'O1', bsds: ['brand.co'] }] }] });
    const out = await run({ action: aiListGroupsAction, propsValue: {} });
    expect(out).toEqual({ groups: [{ guid: 'Bg1', name: 'Main', organization_guid: 'O1', is_active: null, role: null, bsds: ['brand.co'] }] });
  });

  it('search uses the default group, repeated tags and returns next_cursor', async () => {
    const spy = mockBodies({
      bodies: [{ default_group_guid: 'Bdef' }, { links: [{ id: 'bit.ly/a' }], pagination: { search_after: 'cur2' } }],
    });
    const out = await run({ action: aiSearchBitlinksAction, propsValue: { tags: 'x, y', query: 'hello', size: 10, cursor: 'cur1' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/user`);
    expect(spy.mock.calls[1][0].url).toBe(`${BASE}/groups/Bdef/bitlinks?size=10&archived=off&query=hello&tags=x&tags=y&search_after=cur1`);
    expect(out).toEqual({ links: [{ id: 'bit.ly/a' }], next_cursor: 'cur2' });
  });

  it('search returns null cursor on the last page and validates size', async () => {
    mockBodies({ bodies: [{ links: [], pagination: { search_after: '' } }] });
    expect(await run({ action: aiSearchBitlinksAction, propsValue: { group_guid: 'Bg1' } })).toEqual({ links: [], next_cursor: null });
    await expect(run({ action: aiSearchBitlinksAction, propsValue: { group_guid: 'Bg1', size: 500 } })).rejects.toThrow('Page Size');
  });

  it('search rejects a group guid that could change the path', async () => {
    await expect(run({ action: aiSearchBitlinksAction, propsValue: { group_guid: '../user' } })).rejects.toThrow('not a valid Bitly GUID');
  });

  it('get normalises a full short URL', async () => {
    const spy = mockBodies({ bodies: [{ id: 'bit.ly/a' }] });
    await run({ action: aiGetBitlinkAction, propsValue: { bitlink_id: 'https://bit.ly/a' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/bitlinks/bit.ly/a`);
  });

  it('shorten sends comma tags as an array', async () => {
    const spy = mockBodies({ bodies: [{ id: 'bit.ly/a' }] });
    await run({ action: aiShortenUrlAction, propsValue: { long_url: 'https://example.org', tags: 'a,b', title: 'T' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'POST', body: { long_url: 'https://example.org', title: 'T', tags: ['a', 'b'] } });
  });

  it('update leaves archived alone unless set', async () => {
    const spy = mockBodies({ bodies: [{}, {}] });
    await run({ action: aiUpdateBitlinkAction, propsValue: { bitlink_id: 'bit.ly/a', title: 'T' } });
    await run({ action: aiUpdateBitlinkAction, propsValue: { bitlink_id: 'bit.ly/a', archived: 'yes' } });
    expect(spy.mock.calls[0][0].body).toEqual({ title: 'T' });
    expect(spy.mock.calls[1][0].body).toEqual({ archived: true });
    await expect(run({ action: aiUpdateBitlinkAction, propsValue: { bitlink_id: 'bit.ly/a' } })).rejects.toThrow('at least one');
  });

  it('update ignores blank-only tags instead of wiping all tags', async () => {
    const spy = mockBodies({ bodies: [{}] });
    await run({ action: aiUpdateBitlinkAction, propsValue: { bitlink_id: 'bit.ly/a', title: 'T', tags: ' , ' } });
    expect(spy.mock.calls[0][0].body).toEqual({ title: 'T' });
    await expect(run({ action: aiUpdateBitlinkAction, propsValue: { bitlink_id: 'bit.ly/a', tags: '  ' } })).rejects.toThrow('at least one');
  });

  it('clicks passes unit and units', async () => {
    const spy = mockBodies({ bodies: [{ total_clicks: 1 }] });
    await run({ action: aiGetBitlinkClicksAction, propsValue: { bitlink_id: 'bit.ly/a', unit: 'week', units: 4 } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/bitlinks/bit.ly/a/clicks/summary?unit=week&units=4`);
  });

  it('list qr codes pages with search_after', async () => {
    const spy = mockBodies({ bodies: [{ qr_codes: [{ qrcode_id: 'q1' }], pagination: { search_after: 'n' } }] });
    const out = await run({ action: aiListQrCodesAction, propsValue: { group_guid: 'Bg1', cursor: 'c' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/groups/Bg1/qr-codes?size=20&search_after=c`);
    expect(out).toEqual({ qr_codes: [{ qrcode_id: 'q1' }], next_cursor: 'n' });
  });

  it('create qr code needs exactly one destination', async () => {
    const spy = mockBodies({ bodies: [{ qrcode_id: 'q1' }] });
    await run({ action: aiCreateQrCodeAction, propsValue: { bitlink_id: 'bit.ly/a', group_guid: 'Bg1', title: 'Q' } });
    expect(spy.mock.calls[0][0].body).toEqual({ group_guid: 'Bg1', destination: { bitlink_id: 'bit.ly/a' }, title: 'Q' });
    await expect(
      run({ action: aiCreateQrCodeAction, propsValue: { bitlink_id: 'bit.ly/a', long_url: 'https://x.org', group_guid: 'Bg1' } })
    ).rejects.toThrow('not both');
  });
});
