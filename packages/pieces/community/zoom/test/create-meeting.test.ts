import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/index';
import { zoomCreateMeeting } from '../src/lib/actions/create-meeting';
import { zoomCreateMeetingRegistrant } from '../src/lib/actions/create-meeting-registrant';
import { installFetch, jsonResponse, requestOf, runAction } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Create Meeting', () => {
  it('does not leak settings from one run into the next', async () => {
    const fetchMock = installFetch();
    fetchMock.mockImplementation(async () => jsonResponse({ status: 201, body: { id: 1, join_url: 'https://zoom.us/j/1' } }));
    await runAction({ action: zoomCreateMeeting, propsValue: { topic: 'First', auto_recording: 'cloud', audio: 'voip' } });
    await runAction({ action: zoomCreateMeeting, propsValue: { topic: 'Second' } });
    const first = requestOf({ fetchMock, call: 0 }).body;
    const second = requestOf({ fetchMock, call: 1 }).body;
    expect(first.settings.auto_recording).toBe('cloud');
    expect(first.settings.audio).toBe('voip');
    expect(second.settings.auto_recording).toBeUndefined();
    expect(second.settings.audio).toBe('telephony');
  });

  it('builds the body with today\'s defaults and no unknown top-level keys', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { id: 1 } }));
    await runAction({
      action: zoomCreateMeeting,
      propsValue: { topic: 'Demo', start_time: '2026-11-01T15:00:00', auto_recording: 'local', join_url: 'https://ignored', audio: 'both' },
    });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.zoom.us/v2/users/me/meetings');
    expect(Object.keys(request.body).sort()).toEqual(['agenda', 'default_password', 'duration', 'pre_schedule', 'settings', 'start_time', 'timezone', 'topic', 'type']);
    expect(request.body).toMatchObject({ topic: 'Demo', type: 2, duration: 30, timezone: 'UTC', agenda: 'My Meeting', start_time: '2026-11-01T15:00:00' });
    expect(request.body.settings.meeting_authentication).toBe(true);
    expect(request.body.settings.auto_recording).toBe('local');
  });

  it('applies the optional timezone and sign-in props', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { id: 1 } }));
    await runAction({ action: zoomCreateMeeting, propsValue: { topic: 'Demo', timezone: 'America/New_York', require_authentication: false, duration: 45 } });
    const body = requestOf({ fetchMock, call: 0 }).body;
    expect(body.timezone).toBe('America/New_York');
    expect(body.duration).toBe(45);
    expect(body.settings.meeting_authentication).toBe(false);
  });

  it('returns the created meeting on success and throws on a Zoom error', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { id: 99, topic: 'Demo' } }));
    await expect(runAction({ action: zoomCreateMeeting, propsValue: { topic: 'Demo' } })).resolves.toEqual({ id: 99, topic: 'Demo' });
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { code: 300, message: 'Invalid start_time' } }));
    await expect(runAction({ action: zoomCreateMeeting, propsValue: { topic: 'Demo' } })).rejects.toThrow('Invalid start_time');
  });
});

describe('Create Meeting Registrant', () => {
  it('posts the registrant and maps custom questions', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { registrant_id: 'r1', id: 123 } }));
    const result = await runAction({
      action: zoomCreateMeetingRegistrant,
      propsValue: { meeting_id: '123', first_name: 'Ada', email: 'ada@example.com', custom_questions: { Team: 'Ops' } },
    });
    const request = requestOf({ fetchMock, call: 0 });
    expect(result).toEqual({ registrant_id: 'r1', id: 123 });
    expect(request.url).toBe('https://api.zoom.us/v2/meetings/123/registrants');
    expect(request.body).toEqual({ first_name: 'Ada', email: 'ada@example.com', custom_questions: [{ title: 'Team', value: 'Ops' }] });
  });

  it('throws instead of returning the raw HTTP response on failure', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { code: 4711, message: 'Invalid access token, does not contain scopes:[meeting:write:registrant].' } }));
    await expect(runAction({ action: zoomCreateMeetingRegistrant, propsValue: { meeting_id: '123', first_name: 'Ada', email: 'a@b.c' } })).rejects.toThrow('missing the scope meeting:write:registrant');
  });
});
