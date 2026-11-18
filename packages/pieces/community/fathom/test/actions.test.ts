import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRecordingSummary } from '../src/lib/actions/get-recording-summary';
import { getRecordingTranscript } from '../src/lib/actions/get-recording-transcript';
import { listMeetings } from '../src/lib/actions/list-meetings';
import { findTeam } from '../src/lib/actions/find-team';
import { findTeamMember } from '../src/lib/actions/find-team-member';
import { findTeamMemberByEmail } from '../src/lib/actions/find-team-member-by-email';
import { listMeetingTypes } from '../src/lib/actions/list-meeting-types';
import { listUsers } from '../src/lib/actions/list-users';
import { requestRecordingDownload } from '../src/lib/actions/request-recording-download';
import { getRecordingDownload } from '../src/lib/actions/get-recording-download';
import { aiListMeetings } from '../src/lib/actions/ai/list-meetings';
import { aiGetRecordingSummary } from '../src/lib/actions/ai/get-recording-summary';
import { fathomProps } from '../src/lib/common/props';
import { apiKeyAuth, installFetch, jsonResponse, meeting, oauthAuth, requestOf, runAction } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
  fetchMock = installFetch();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('legacy SDK actions now fail instead of returning empty success', () => {
  it('Get Recording Summary throws a reconnect error on 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 401, body: { error: 'invalid token' } }));
    await expect(runAction({ action: getRecordingSummary, propsValue: { recording_id: 5 } })).rejects.toThrow(
      'Fathom did not accept the connection (401): invalid token. Reconnect'
    );
  });

  it('Get Recording Summary throws a rate limit error on a persistent 429', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () => jsonResponse({ status: 429, body: { error: 'slow down' } }));
    const pending = runAction({ action: getRecordingSummary, propsValue: { recording_id: 5 } }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(120000);
    expect(String(await pending)).toContain('Fathom rate limit reached (429): slow down');
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
  });

  it('Get Recording Summary keeps the SDK camelCase output on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { summary: { template_name: 'general', markdown_formatted: '## Hi' } } }));
    const result = await runAction({ action: getRecordingSummary, propsValue: { recording_id: 5 } });
    expect(result).toEqual({ summary: { templateName: 'general', markdownFormatted: '## Hi' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.fathom.ai/external/v1/recordings/5/summary');
  });

  it('List Meetings throws on 400 instead of returning [undefined]', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 400, body: { error: 'bad created_after' } }));
    await expect(runAction({ action: listMeetings, propsValue: { created_after: 'yesterday' } })).rejects.toThrow(
      'Fathom rejected the request (400): bad created_after'
    );
  });

  it('List Meetings blocks summary/transcript flags on OAuth before calling Fathom', async () => {
    await expect(runAction({ action: listMeetings, propsValue: { include_summary: true } })).rejects.toThrow('OAuth connections');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('List Meetings follows every page by default and stops at Max Pages when set', async () => {
    const page = (cursor: string | null) => jsonResponse({ body: { limit: 10, next_cursor: cursor, items: [meeting({})] } });
    fetchMock.mockResolvedValueOnce(page('c2')).mockResolvedValueOnce(page('c3')).mockResolvedValueOnce(page(null));
    const all = await runAction({ action: listMeetings, propsValue: {} });
    expect(all).toHaveLength(3);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => page('more'));
    const capped = await runAction({ action: listMeetings, propsValue: { max_pages: 2 } });
    expect(capped).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('Get Recording Transcript without a destination URL returns the SDK camelCase shape', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ body: { transcript: [{ speaker: { display_name: 'Jo', matched_calendar_invitee_email: null }, text: 'Hi', timestamp: '00:00:01' }] } })
    );
    const result = await runAction({ action: getRecordingTranscript, propsValue: { recording_id: 7 } });
    expect(result).toEqual({ transcript: [{ speaker: { displayName: 'Jo', matchedCalendarInviteeEmail: null }, text: 'Hi', timestamp: '00:00:01' }] });
  });

  it('Find Team works when Fathom returns limit null and keeps the SDK shape', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { limit: null, next_cursor: null, items: [{ name: 'Sales', created_at: '2026-01-02T03:04:05Z' }] } }));
    const result = await runAction({ action: findTeam, propsValue: {} });
    expect(result).toEqual({ result: { limit: null, nextCursor: null, items: [{ name: 'Sales', createdAt: '2026-01-02T03:04:05.000Z' }] } });
  });

  it('Find Team Member passes the team filter and throws on 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: {} }));
    await expect(runAction({ action: findTeamMember, propsValue: { team: ' Sales ' } })).rejects.toThrow('(401)');
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.fathom.ai/external/v1/team_members?team=Sales');
  });
});

describe('new actions', () => {
  it('List Meetings (AI) returns one page with has_more and sends repeated array filters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { limit: 10, next_cursor: 'n2', items: [meeting({})] } }));
    const result = await runAction({
      action: aiListMeetings,
      propsValue: { recorded_by: ['a@example.com'], meeting_type: 'QBR', include_highlights: true, created_after: '2026-01-01T00:00:00.000Z' },
      auth: apiKeyAuth(),
    });
    expect(result).toMatchObject({ next_cursor: 'n2', has_more: true });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe(
      'https://api.fathom.ai/external/v1/meetings?created_after=2026-01-01T00%3A00%3A00Z&recorded_by%5B%5D=a%40example.com&meeting_type=QBR&include_highlights=true'
    );
  });

  it('Get Recording Summary (AI) validates the recording ID before any request', async () => {
    await expect(runAction({ action: aiGetRecordingSummary, propsValue: { recording_id: '12/../x' } })).rejects.toThrow('numeric recording_id');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('List Meeting Types errors instead of returning a partial list past 20 pages', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ body: { items: [{ name: 'QBR', status: 'active' }], next_cursor: 'more' } }));
    await expect(runAction({ action: listMeetingTypes, propsValue: {} })).rejects.toThrow('more than 20 pages');
    expect(fetchMock).toHaveBeenCalledTimes(20);
  });

  it('List Meeting Types filters by status', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ body: { items: [{ name: 'A', status: 'active' }, { name: 'B', status: 'inactive' }], next_cursor: null } })
    );
    expect(await runAction({ action: listMeetingTypes, propsValue: { status: 'inactive' } })).toEqual({ items: [{ name: 'B', status: 'inactive' }], count: 1 });
  });

  it('List Users refuses invited + admin level and maps 403', async () => {
    await expect(runAction({ action: listUsers, propsValue: { status: 'invited', settings_access: 'none' } })).rejects.toThrow('cannot filter invited');
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 403, body: { error: 'Forbidden' } }));
    await expect(runAction({ action: listUsers, propsValue: {} })).rejects.toThrow('Fathom refused access (403)');
  });

  it('Find Team Member by Email stops at the first page with a match', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: { items: [{ email: 'x@example.com' }], next_cursor: 'c2' } }))
      .mockResolvedValueOnce(jsonResponse({ body: { items: [{ name: 'Jo', email: 'Jo@Example.com' }], next_cursor: 'c3' } }));
    const result = await runAction({ action: findTeamMemberByEmail, propsValue: { email: 'jo@example.com' } });
    expect(result).toEqual({ found: true, member: { name: 'Jo', email: 'Jo@Example.com' } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('Find Team Member by Email returns found=false at the end and errors at the 50-page cap', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { items: [], next_cursor: null } }));
    expect(await runAction({ action: findTeamMemberByEmail, propsValue: { email: 'jo@example.com' } })).toEqual({ found: false, member: null });
    fetchMock.mockImplementation(async () => jsonResponse({ body: { items: [], next_cursor: 'more' } }));
    await expect(runAction({ action: findTeamMemberByEmail, propsValue: { email: 'jo@example.com' } })).rejects.toThrow('first 50 pages');
  });

  it('Request Recording Download posts to the download endpoint and surfaces 422', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 422, body: { error: 'recording has no downloadable media' } }));
    await expect(runAction({ action: requestRecordingDownload, propsValue: { recording_id: '157155195' } })).rejects.toThrow('(422)');
    const req = requestOf({ fetchMock, call: 0 });
    expect(req.method).toBe('POST');
    expect(req.url).toBe('https://api.fathom.ai/external/v1/recordings/157155195/download');
  });

  it('Get Recording Download rejects a download ID with path characters', async () => {
    await expect(runAction({ action: getRecordingDownload, propsValue: { recording_id: '1', download_id: '../../x' } })).rejects.toThrow('Download ID');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('recording dropdown', () => {
  it('stops after 10 pages and says so', async () => {
    let n = 0;
    fetchMock.mockImplementation(async () => {
      n++;
      return jsonResponse({ body: { items: [meeting({ recording_id: n, title: `M${n}` })], next_cursor: 'more' } });
    });
    const dropdown = fathomProps.recordingDropdown({ description: 'x' });
    const result = await dropdown.options({ auth: oauthAuth() }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' } });
    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(result.options[0]).toEqual({ label: 'M1 · 2026-10-01', value: 1 });
    expect(result.placeholder).toContain('10 most recent pages');
  });

  it('names the status on error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: {} }));
    const dropdown = fathomProps.recordingDropdown({ description: 'x' });
    const result = await dropdown.options({ auth: oauthAuth() }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' } });
    expect(result).toMatchObject({ disabled: true, placeholder: expect.stringContaining('Reconnect') });
  });
});
