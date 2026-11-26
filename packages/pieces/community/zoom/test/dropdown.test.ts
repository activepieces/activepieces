import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/index';
import { zoomMeetingDropdown } from '../src/lib/common/props';
import { installFetch, jsonResponse, oauthAuth, requestOf } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

function loadOptions() {
  return Reflect.apply(zoomMeetingDropdown.options, zoomMeetingDropdown, [{ auth: oauthAuth() }, {}]);
}

describe('meeting dropdown', () => {
  it('follows every page and stops on a repeated token', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { meetings: [{ id: 1, topic: 'A' }], next_page_token: 't1' } }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { meetings: [{ id: 2, topic: '' }], next_page_token: 't1' } }));
    const result = await loadOptions();
    expect(result.options).toEqual([{ label: 'A', value: '1' }, { label: 'Meeting 2', value: '2' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestOf({ fetchMock, call: 1 }).url).toContain('next_page_token=t1');
  });

  it('adds the start date to the label and keeps the meeting ID as the value', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { meetings: [{ id: 85746065432, topic: 'Weekly sync', start_time: '2026-11-01T15:00:00Z' }, { id: 3, topic: 'No date' }] } }));
    const result = await loadOptions();
    expect(result.options).toEqual([{ label: 'Weekly sync (2026-11-01)', value: '85746065432' }, { label: 'No date', value: '3' }]);
  });

  it('names the missing scope and other failures', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { code: 4711, message: 'Invalid access token, does not contain scopes:[meeting:read:list_meetings].' } }));
    expect((await loadOptions()).placeholder).toContain('meeting:read:list_meetings');
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: { code: 124, message: 'Invalid access token.' } }));
    expect((await loadOptions()).placeholder).toContain('Reconnect');
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 429, body: { message: 'slow down' } }));
    expect((await loadOptions()).placeholder).toContain('rate limit');
  });
});
