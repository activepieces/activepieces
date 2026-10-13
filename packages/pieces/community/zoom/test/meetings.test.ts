import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/index';
import { zoomGetMeeting } from '../src/lib/actions/get-meeting';
import { zoomFindMeeting } from '../src/lib/actions/find-meeting';
import { zoomUpdateMeeting } from '../src/lib/actions/update-meeting';
import { zoomUpdateMeetingById } from '../src/lib/actions/update-meeting-by-id';
import { zoomListMeetings } from '../src/lib/actions/list-meetings';
import { zoomDeleteMeeting } from '../src/lib/actions/delete-meeting';
import { zoomGetCurrentUser } from '../src/lib/actions/get-current-user';
import { emptyResponse, installFetch, jsonResponse, requestOf, runAction } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Get Meeting / Find Meeting', () => {
  it('gets a meeting with occurrence options', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { id: 85746065432, topic: 'T' } }));
    const result = await runAction({ action: zoomGetMeeting, propsValue: { meeting_id: '857 4606 5432', occurrence_id: '1648194360000', show_previous_occurrences: true } });
    expect(result).toEqual({ id: 85746065432, topic: 'T' });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/meetings/85746065432?occurrence_id=1648194360000&show_previous_occurrences=true');
  });

  it('keeps Find Meeting on the same request', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { id: 1 } }));
    await runAction({ action: zoomFindMeeting, propsValue: { meeting_id: '1', show_previous_occurrences: false } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/meetings/1');
  });
});

describe('Update Meeting (by ID)', () => {
  it('sends only the fields given', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(emptyResponse({ status: 204 }));
    const result = await runAction({ action: zoomUpdateMeetingById, propsValue: { meeting_id: '1', topic: 'New', duration: 0, waiting_room: false } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('PATCH');
    expect(request.body).toEqual({ topic: 'New', duration: 0, settings: { waiting_room: false } });
    expect(result).toEqual({ success: true, meeting_id: '1', occurrence_id: null, updated_fields: ['topic', 'duration', 'settings.waiting_room'] });
  });

  it('clears the agenda with Clear Agenda and targets an occurrence', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(emptyResponse({ status: 204 }));
    await runAction({ action: zoomUpdateMeetingById, propsValue: { meeting_id: '1', clear_agenda: true, occurrence_id: '42' } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe('https://api.zoom.us/v2/meetings/1?occurrence_id=42');
    expect(request.body).toEqual({ agenda: '' });
  });

  it('refuses an empty update before calling Zoom', async () => {
    const fetchMock = installFetch();
    await expect(runAction({ action: zoomUpdateMeetingById, propsValue: { meeting_id: '1' } })).rejects.toThrow('Nothing to update');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Update Zoom Meeting (existing)', () => {
  it('returns the meeting ID along with the old fields', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(emptyResponse({ status: 204 }));
    const result = await runAction({ action: zoomUpdateMeeting, propsValue: { meeting_id: '5', topic: 'X' } });
    expect(result).toEqual({ success: true, message: 'Meeting updated successfully', meeting_id: '5' });
    expect(requestOf({ fetchMock, call: 0 }).body).toEqual({ topic: 'X' });
  });
});

describe('List Meetings', () => {
  it('returns one page with the next page token', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { page_size: 2, total_records: 3, next_page_token: 'tok2', meetings: [{ id: 1 }, { id: 2 }] } }));
    const result = await runAction({ action: zoomListMeetings, propsValue: { type: 'upcoming', page_size: 2, next_page_token: 'tok1' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=2&next_page_token=tok1');
    expect(result).toMatchObject({ meetings: [{ id: 1 }, { id: 2 }], next_page_token: 'tok2', has_more: true, total_records: 3 });
  });

  it('reports the last page', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { page_size: 30, total_records: 0, next_page_token: '', meetings: [] } }));
    const result = await runAction({ action: zoomListMeetings, propsValue: {} });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/users/me/meetings?type=scheduled&page_size=30');
    expect(result).toMatchObject({ meetings: [], next_page_token: null, has_more: false });
  });
});

describe('Delete Meeting', () => {
  it('deletes and passes reminder flags', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(emptyResponse({ status: 204 }));
    const result = await runAction({ action: zoomDeleteMeeting, propsValue: { meeting_id: '7', cancel_meeting_reminder: true } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe('https://api.zoom.us/v2/meetings/7?schedule_for_reminder=false&cancel_meeting_reminder=true');
    expect(result).toEqual({ success: true, meeting_id: '7', occurrence_id: null });
  });

  it('sends explicit false for both reminders when the boxes are off, since Zoom defaults schedule_for_reminder to true', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(emptyResponse({ status: 204 }));
    await runAction({ action: zoomDeleteMeeting, propsValue: { meeting_id: '7' } });
    const url = new URL(requestOf({ fetchMock, call: 0 }).url);
    expect(url.searchParams.get('schedule_for_reminder')).toBe('false');
    expect(url.searchParams.get('cancel_meeting_reminder')).toBe('false');
  });

  it('fails with a clear message when Zoom does not find the meeting', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 404, body: { code: 3001, message: 'Meeting does not exist: 7.' } }));
    await expect(runAction({ action: zoomDeleteMeeting, propsValue: { meeting_id: '7' } })).rejects.toThrow('Zoom meeting 7 was not found');
  });

  it('still fails on other errors', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 404, body: { code: 1001, message: 'User does not exist.' } }));
    await expect(runAction({ action: zoomDeleteMeeting, propsValue: { meeting_id: '7' } })).rejects.toThrow('User does not exist');
  });
});

describe('Get Current User', () => {
  it('reads /users/me', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { id: 'u1', email: 'a@b.c', type: 1 } }));
    await expect(runAction({ action: zoomGetCurrentUser, propsValue: {} })).resolves.toEqual({ id: 'u1', email: 'a@b.c', type: 1 });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.zoom.us/v2/users/me');
  });
});
