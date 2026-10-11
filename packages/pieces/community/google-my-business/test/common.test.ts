import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { googleBusinessCommon } from '../src/lib/common/common';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

beforeEach(() => {
  sendRequest.mockReset();
});

describe('account dropdown', () => {
  it('asks for a connection when there is none', async () => {
    expect(await loadOptions({ prop: googleBusinessCommon.account, propsValue: {} })).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Please connect your account first',
    });
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('lists accounts from Account Management across every page', async () => {
    ok({ body: { accounts: [{ name: 'accounts/1', accountName: 'Main Street Bakery' }], nextPageToken: 'page-2' } });
    ok({ body: { accounts: [{ name: 'accounts/2', accountName: 'Harbor Cafe' }] } });

    expect(await loadOptions({ prop: googleBusinessCommon.account, propsValue: CONNECTED })).toEqual({
      disabled: false,
      options: [
        { label: 'Main Street Bakery', value: 'accounts/1' },
        { label: 'Harbor Cafe', value: 'accounts/2' },
      ],
    });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(0).url).toBe('https://mybusinessaccountmanagement.googleapis.com/v1/accounts');
    expect(request(0).queryParams).toEqual({ pageSize: '20' });
    expect(request(1).queryParams).toEqual({ pageSize: '20', pageToken: 'page-2' });
  });

  it('shows an empty state when the response has no accounts field', async () => {
    ok({ body: {} });

    expect(await loadOptions({ prop: googleBusinessCommon.account, propsValue: CONNECTED })).toEqual({
      disabled: false,
      options: [],
      placeholder: 'No Business Profile accounts found',
    });
  });

  it.each([
    [{ status: 403, body: { error: { details: [{ reason: 'SERVICE_DISABLED' }] } } }, 'Enable the Business Profile APIs first'],
    [{ status: 403, body: { error: { errors: [{ reason: 'accessNotConfigured' }] } } }, 'Enable the Business Profile APIs first'],
    [{ status: 403, body: { error: { message: 'The caller does not have permission' } } }, 'No access to Business Profile'],
    [{ status: 500, body: {} }, 'Could not load accounts'],
  ])('turns a failed request into a short placeholder', async (failure, placeholder) => {
    fail(failure);

    expect(await loadOptions({ prop: googleBusinessCommon.account, propsValue: CONNECTED })).toEqual({
      disabled: true,
      options: [],
      placeholder,
    });
  });
});

describe('location dropdown', () => {
  it('asks for an account before loading locations', async () => {
    expect(await loadOptions({ prop: googleBusinessCommon.location, propsValue: CONNECTED })).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Please select an account first',
    });
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('pages through locations and falls back to the name when a title is missing', async () => {
    ok({ body: { locations: [{ name: 'locations/10', title: 'Downtown' }], nextPageToken: 'page-2' } });
    ok({ body: { locations: [{ name: 'locations/11', title: '' }] } });

    expect(
      await loadOptions({ prop: googleBusinessCommon.location, propsValue: { ...CONNECTED, account: 'accounts/1' } }),
    ).toEqual({
      disabled: false,
      options: [
        { label: 'Downtown', value: 'locations/10' },
        { label: 'locations/11', value: 'locations/11' },
      ],
    });
    expect(request(0).url).toBe('https://mybusinessbusinessinformation.googleapis.com/v1/accounts/1/locations');
    expect(request(1).queryParams).toEqual({ pageSize: '100', read_mask: 'title,name', pageToken: 'page-2' });
  });

  it('turns a failed request into a short placeholder', async () => {
    fail({ status: 500, body: {} });

    expect(
      await loadOptions({ prop: googleBusinessCommon.location, propsValue: { ...CONNECTED, account: 'accounts/1' } }),
    ).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Could not load locations',
    });
  });
});

function ok({ body }: { body: unknown }) {
  sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function fail({ status, body }: { status: number; body: unknown }) {
  sendRequest.mockRejectedValueOnce(new HttpError({}, { status, responseBody: body }));
}

function request(index: number) {
  return sendRequest.mock.calls[index][0];
}

function loadOptions({ prop, propsValue }: { prop: { options: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const options = prop.options;
  if (typeof options !== 'function') {
    throw new Error('dropdown has no options function');
  }
  return Promise.resolve(Reflect.apply(options, prop, [propsValue, {}]));
}

const CONNECTED = { auth: { access_token: 'test-token' } };
