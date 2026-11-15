import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/index';
import { zoomListPastMeetingInstances } from '../src/lib/actions/list-past-meeting-instances';
import { listRecordingsHelpers, zoomListRecordings } from '../src/lib/actions/list-recordings';
import { installFetch, jsonResponse, requestOf, runAction } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Past meetings', () => {
  it('lists past instances', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { meetings: [{ uuid: 'abc==', start_time: '2026-10-01T10:00:00Z' }] } }));
    const result = await runAction({ action: zoomListPastMeetingInstances, propsValue: { meeting_id: '9' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/past_meetings/9/instances');
    expect(result).toEqual({ meeting_id: '9', meetings: [{ uuid: 'abc==', start_time: '2026-10-01T10:00:00Z' }] });
  });
});

describe('Recordings', () => {
  it('lists recordings for a valid range', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { from: '2026-09-01', to: '2026-09-30', meetings: [], next_page_token: '' } }));
    await runAction({ action: zoomListRecordings, propsValue: { from: '2026-09-01', to: '2026-09-30' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/users/me/recordings?from=2026-09-01&to=2026-09-30&page_size=30');
  });

  it('validates the date range before calling Zoom', async () => {
    const fetchMock = installFetch();
    await expect(runAction({ action: zoomListRecordings, propsValue: { from: '2026-09-01', to: '2026-10-05' } })).rejects.toThrow('at most one month');
    await expect(runAction({ action: zoomListRecordings, propsValue: { from: '2026-09-10', to: '2026-09-01' } })).rejects.toThrow('on or after');
    await expect(runAction({ action: zoomListRecordings, propsValue: { from: '2026-02-30' } })).rejects.toThrow('not a real calendar date');
    await expect(runAction({ action: zoomListRecordings, propsValue: { from: '2026-10-01T12:00:00Z' } })).rejects.toThrow('no time part');
    await expect(runAction({ action: zoomListRecordings, propsValue: { from: '2026-09-01', to: '2026-09-30 extra' } })).rejects.toThrow('no time part');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('defaults To Date to today, capped at one month after From Date', () => {
    const today = new Date(Date.UTC(2026, 9, 5));
    expect(listRecordingsHelpers.recordingRange({ from: '2026-09-20', to: undefined, today })).toEqual({ from: '2026-09-20', to: '2026-10-05' });
    expect(listRecordingsHelpers.recordingRange({ from: '2026-01-31', to: undefined, today })).toEqual({ from: '2026-01-31', to: '2026-02-28' });
  });

  it('returns the date range it used so the next page can reuse it', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 5, 23, 59)));
    try {
      const fetchMock = installFetch();
      fetchMock.mockResolvedValueOnce(jsonResponse({ body: { meetings: [], next_page_token: 'tok2' } }));
      const result = await runAction({ action: zoomListRecordings, propsValue: { from: '2026-09-20' } });
      expect(result).toMatchObject({ from: '2026-09-20', to: '2026-10-05', next_page_token: 'tok2', has_more: true });
      vi.setSystemTime(new Date(Date.UTC(2026, 9, 6, 0, 1)));
      fetchMock.mockResolvedValueOnce(jsonResponse({ body: { meetings: [], next_page_token: '' } }));
      await runAction({ action: zoomListRecordings, propsValue: { from: '2026-09-20', to: '2026-10-05', next_page_token: 'tok2' } });
      expect(requestOf({ fetchMock, call: 1 }).url).toBe('https://api.zoom.us/v2/users/me/recordings?from=2026-09-20&to=2026-10-05&page_size=30&next_page_token=tok2');
    } finally {
      vi.useRealTimers();
    }
  });

  it('requires To Date with a page token so the range cannot shift between pages', async () => {
    const fetchMock = installFetch();
    await expect(runAction({ action: zoomListRecordings, propsValue: { from: '2026-09-20', next_page_token: 'tok2' } })).rejects.toThrow('To Date is required when Next Page Token is set');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps Zoom paid-plan errors to a clear message', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { code: 200, message: 'Only available for Paid account.' } }));
    await expect(runAction({ action: zoomListRecordings, propsValue: { from: '2026-09-01', to: '2026-09-30' } })).rejects.toThrow('needs a paid (Pro or higher) Zoom plan');
  });
});
