import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatDropdown, smsFromNumberDropdown } from './props';
import { oauth, stubHttp } from './test-support/http-stub';

afterEach(() => vi.restoreAllMocks());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const optionsOf = (prop: any, auth: unknown) => prop.options({ auth }, {} as any);

const PHONE_PATH = '/extension/~/phone-number';
const CHATS_PATH = '/team-messaging/v1/chats';

describe('smsFromNumberDropdown', () => {
  it('offers only numbers carrying the SmsSender feature', async () => {
    const stub = stubHttp();
    stub.route(PHONE_PATH, {
      records: [
        { phoneNumber: '+14155550100', usageType: 'DirectNumber', features: ['SmsSender', 'CallerId'] },
        // Assigned for caller ID only. RingCentral refuses a send from it with MSG-242, so offering
        // it would just move the failure to run time.
        { phoneNumber: '+14155550111', usageType: 'DirectNumber', features: ['CallerId'] },
        { phoneNumber: '+14155550122', usageType: 'MainCompanyNumber' },
      ],
    });

    const result = await optionsOf(smsFromNumberDropdown, oauth());

    expect(result.disabled).toBe(false);
    expect(result.options).toEqual([
      { label: '+14155550100 (DirectNumber)', value: '+14155550100' },
    ]);
  });

  it('says why the list is empty rather than showing an empty dropdown', async () => {
    const stub = stubHttp();
    stub.route(PHONE_PATH, { records: [{ phoneNumber: '+1', features: ['CallerId'] }] });

    const result = await optionsOf(smsFromNumberDropdown, oauth());

    expect(result.disabled).toBe(true);
    expect(result.placeholder).toMatch(/No SMS-enabled numbers/);
  });

  it('asks for the numbers in one page of the documented maximum', async () => {
    const stub = stubHttp();
    stub.route(PHONE_PATH, { records: [] });

    await optionsOf(smsFromNumberDropdown, oauth());

    expect(stub.find(PHONE_PATH)?.queryParams).toEqual({ perPage: '1000' });
  });

  it('prompts to connect before an account exists', async () => {
    const result = await optionsOf(smsFromNumberDropdown, undefined);
    expect(result.disabled).toBe(true);
    expect(result.options).toEqual([]);
  });

  it('tolerates a response with no records array', async () => {
    const stub = stubHttp();
    stub.route(PHONE_PATH, {});
    const result = await optionsOf(smsFromNumberDropdown, oauth());
    expect(result.disabled).toBe(true);
  });
});

describe('chatDropdown', () => {
  it('labels a named chat by name and an unnamed one by type and id', async () => {
    const stub = stubHttp();
    stub.route(CHATS_PATH, {
      records: [
        { id: '111', name: 'Dispatch', type: 'Team' },
        { id: '222', type: 'Direct' },
      ],
    });

    const result = await optionsOf(chatDropdown, oauth());

    expect(result.options).toEqual([
      { label: 'Dispatch', value: '111' },
      { label: 'Direct (222)', value: '222' },
    ]);
  });

  it('follows the page tokens, so a chat past the first page is still selectable', async () => {
    const stub = stubHttp();
    let call = 0;
    stub.route(CHATS_PATH, () => {
      call++;
      return call === 1
        ? { records: [{ id: '1', name: 'first' }], navigation: { nextPageToken: 'tok-2' } }
        : { records: [{ id: '2', name: 'second' }] };
    });

    const result = await optionsOf(chatDropdown, oauth());

    expect(result.options.map((o: { value: string }) => o.value)).toEqual(['1', '2']);
    // The second request carries the token from the first.
    expect(stub.calls.filter((c) => c.url.includes(CHATS_PATH))).toHaveLength(2);
    expect(stub.calls[1].queryParams).toMatchObject({ pageToken: 'tok-2' });
  });

  it('stops at the page cap rather than looping forever on a repeating token', async () => {
    const stub = stubHttp();
    // A server that always reports another page would otherwise hang the dropdown.
    stub.route(CHATS_PATH, { records: [{ id: 'x' }], navigation: { nextPageToken: 'same' } });

    await optionsOf(chatDropdown, oauth());

    expect(stub.calls.filter((c) => c.url.includes(CHATS_PATH))).toHaveLength(10);
  });

  it('prompts to connect before an account exists', async () => {
    const result = await optionsOf(chatDropdown, undefined);
    expect(result.disabled).toBe(true);
  });
});
