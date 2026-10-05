import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/index';
import { zoomListMeetingRegistrants } from '../src/lib/actions/list-meeting-registrants';
import { zoomUpdateRegistrantStatus } from '../src/lib/actions/update-registrant-status';
import { zoomListPastMeetingInstances } from '../src/lib/actions/list-past-meeting-instances';
import { zoomGetPastMeeting } from '../src/lib/actions/get-past-meeting';
import { zoomListPastMeetingParticipants } from '../src/lib/actions/list-past-meeting-participants';
import { zoomGetMeetingSummary } from '../src/lib/actions/get-meeting-summary';
import { listRecordingsHelpers, zoomListRecordings } from '../src/lib/actions/list-recordings';
import { zoomGetMeetingRecordings } from '../src/lib/actions/get-meeting-recordings';
import { zoomDeleteMeetingRecordings } from '../src/lib/actions/delete-meeting-recordings';
import { emptyResponse, installFetch, jsonResponse, requestOf, runAction } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Registrants', () => {
  it('lists registrants by status with paging', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { registrants: [{ id: 'r1' }], next_page_token: 'n' } }));
    const result = await runAction({ action: zoomListMeetingRegistrants, propsValue: { meeting_id: '9', status: 'pending', page_size: 50 } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/meetings/9/registrants?status=pending&page_size=50');
    expect(result).toMatchObject({ registrants: [{ id: 'r1' }], next_page_token: 'n', has_more: true });
  });

  it('updates registrant status with a PUT and returns what it sent', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(emptyResponse({ status: 204 }));
    const result = await runAction({
      action: zoomUpdateRegistrantStatus,
      propsValue: { meeting_id: '9', action: 'approve', registrants: [{ id: 'r1' }, { email: ' b@c.d ' }] },
    });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('https://api.zoom.us/v2/meetings/9/registrants/status');
    expect(request.body).toEqual({ action: 'approve', registrants: [{ id: 'r1' }, { email: 'b@c.d' }] });
    expect(result).toEqual({ success: true, meeting_id: '9', action: 'approve', registrants: [{ id: 'r1' }, { email: 'b@c.d' }] });
  });

  it('validates registrants before calling Zoom', async () => {
    const fetchMock = installFetch();
    await expect(runAction({ action: zoomUpdateRegistrantStatus, propsValue: { meeting_id: '9', action: 'deny', registrants: [{}] } })).rejects.toThrow('neither');
    await expect(
      runAction({ action: zoomUpdateRegistrantStatus, propsValue: { meeting_id: '9', action: 'deny', registrants: Array.from({ length: 31 }, (_, i) => ({ id: `r${i}` })) } }),
    ).rejects.toThrow('at most 30');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Past meetings and summaries', () => {
  it('lists past instances', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { meetings: [{ uuid: 'abc==', start_time: '2026-10-01T10:00:00Z' }] } }));
    const result = await runAction({ action: zoomListPastMeetingInstances, propsValue: { meeting_id: '9' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/past_meetings/9/instances');
    expect(result).toEqual({ meeting_id: '9', meetings: [{ uuid: 'abc==', start_time: '2026-10-01T10:00:00Z' }] });
  });

  it('double-encodes a UUID that starts with a slash', async () => {
    const fetchMock = installFetch();
    fetchMock.mockImplementation(async () => jsonResponse({ body: { uuid: '/abc==' } }));
    await runAction({ action: zoomGetPastMeeting, propsValue: { meeting: '/abc==' } });
    await runAction({ action: zoomGetMeetingSummary, propsValue: { meeting: 'xy+z==' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/past_meetings/%252Fabc%253D%253D');
    expect(requestOf({ fetchMock, call: 1 }).url).toBe('https://api.zoom.us/v2/meetings/xy%2Bz%3D%3D/meeting_summary');
  });

  it('lists participants one page at a time', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { participants: [{ name: 'Ada' }], next_page_token: '' } }));
    const result = await runAction({ action: zoomListPastMeetingParticipants, propsValue: { meeting: '9', next_page_token: 'p2' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/past_meetings/9/participants?page_size=30&next_page_token=p2');
    expect(result).toMatchObject({ participants: [{ name: 'Ada' }], has_more: false, next_page_token: null });
  });

  it('explains a missing summary scope', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { code: 4711, message: 'Invalid access token, does not contain scopes:[meeting:read:summary].' } }));
    await expect(runAction({ action: zoomGetMeetingSummary, propsValue: { meeting: '9' } })).rejects.toThrow('Add it under Scopes in your Zoom Marketplace app');
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
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('defaults To Date to today, capped at one month after From Date', () => {
    const today = new Date(Date.UTC(2026, 9, 5));
    expect(listRecordingsHelpers.recordingRange({ from: '2026-09-20', to: undefined, today })).toEqual({ from: '2026-09-20', to: '2026-10-05' });
    expect(listRecordingsHelpers.recordingRange({ from: '2026-01-31', to: undefined, today })).toEqual({ from: '2026-01-31', to: '2026-02-28' });
  });

  it('gets meeting recordings and trashes them by default', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { id: 9, recording_files: [] } }));
    fetchMock.mockResolvedValueOnce(emptyResponse({ status: 204 }));
    await runAction({ action: zoomGetMeetingRecordings, propsValue: { meeting: '9' } });
    const result = await runAction({ action: zoomDeleteMeetingRecordings, propsValue: { meeting: '9' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/meetings/9/recordings');
    expect(requestOf({ fetchMock, call: 1 }).url).toBe('https://api.zoom.us/v2/meetings/9/recordings?action=trash');
    expect(result).toEqual({ success: true, meeting: '9', action: 'trash' });
  });

  it('fails clearly when the meeting has no recordings', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 404, body: { code: 3301, message: 'This recording does not exist.' } }));
    await expect(runAction({ action: zoomDeleteMeetingRecordings, propsValue: { meeting: '9', action: 'delete' } })).rejects.toThrow('no cloud recordings for meeting 9');
  });

  it('maps Zoom paid-plan errors to a clear message', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { code: 200, message: 'Only available for Paid account.' } }));
    await expect(runAction({ action: zoomGetMeetingSummary, propsValue: { meeting: '9' } })).rejects.toThrow('needs a paid (Pro or higher) Zoom plan');
  });
});
