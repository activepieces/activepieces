import { afterEach, describe, expect, test, vi } from 'vitest';
import { uploadAudioAction, uploadAudioInternals } from '../src/lib/actions/upload-audio';

afterEach(() => vi.unstubAllGlobals());

const NOW = Date.parse('2026-03-15T08:00:00.000Z');

const BASE = {
  audioUrl: 'https://example.com/a.mp3',
  title: 'Call',
  clientReferenceId: undefined,
  customLanguage: undefined,
  meetingDate: undefined,
  bypassSizeCheck: undefined,
  now: NOW,
};

describe('upload_audio input', () => {
  test('sends only the url and title by default', () => {
    expect(uploadAudioInternals.buildUploadInput(BASE)).toEqual({ url: 'https://example.com/a.mp3', title: 'Call' });
  });

  test('maps the optional fields, with yes/no instead of a checkbox', () => {
    const input = uploadAudioInternals.buildUploadInput({ ...BASE, clientReferenceId: 'ref-1', customLanguage: 'es', meetingDate: '2026-03-10T09:30:00Z', bypassSizeCheck: 'no' });
    expect(input).toEqual({
      url: 'https://example.com/a.mp3',
      title: 'Call',
      client_reference_id: 'ref-1',
      custom_language: 'es',
      meeting_date: '2026-03-10T09:30:00.000Z',
      bypass_size_check: false,
    });
  });

  test('a date-only meeting date is sent as noon UTC, clamped to now for today', () => {
    expect(uploadAudioInternals.buildUploadInput({ ...BASE, meetingDate: '2026-03-10' })['meeting_date']).toBe('2026-03-10T12:00:00.000Z');
    expect(uploadAudioInternals.buildUploadInput({ ...BASE, meetingDate: '2026-03-15' })['meeting_date']).toBe('2026-03-15T08:00:00.000Z');
  });

  test('rejects a future or impossible meeting date', () => {
    expect(() => uploadAudioInternals.buildUploadInput({ ...BASE, meetingDate: '2026-03-16' })).toThrow('cannot be in the future');
    expect(() => uploadAudioInternals.buildUploadInput({ ...BASE, meetingDate: '2026-03-15T09:00:00Z' })).toThrow('cannot be in the future');
    expect(() => uploadAudioInternals.buildUploadInput({ ...BASE, meetingDate: '2026-02-30' })).toThrow('not a real calendar date');
    expect(() => uploadAudioInternals.buildUploadInput({ ...BASE, bypassSizeCheck: 'maybe' })).toThrow('must be one of');
  });
});

describe('upload_audio result', () => {
  test('success:false fails the step with the vendor message', async () => {
    stubFetch({ body: { data: { uploadAudio: { success: false, title: 'Call', message: 'Could not download the file' } } } });
    await expect(uploadAudioAction.run(fakeContext())).rejects.toThrow('Could not download the file');
  });

  test('a GraphQL error (paid_required) fails the step', async () => {
    stubFetch({ body: { data: null, errors: [{ message: 'Upgrade required', code: 'paid_required', extensions: { status: 403 } }] } });
    await expect(uploadAudioAction.run(fakeContext())).rejects.toThrow('paid_required');
  });

  test('returns the slim mutation payload on success', async () => {
    stubFetch({ body: { data: { uploadAudio: { success: true, title: 'Call', message: 'Uploaded audio has been queued for processing.' } } } });
    await expect(uploadAudioAction.run(fakeContext())).resolves.toEqual({ success: true, title: 'Call', message: 'Uploaded audio has been queued for processing.' });
  });
});

function fakeContext(): Parameters<typeof uploadAudioAction.run>[0] {
  return Object.assign(Object.create(null), {
    auth: { type: 'SECRET_TEXT', secret_text: 'key' },
    propsValue: { audioUrl: 'https://example.com/a.mp3', title: 'Call' },
  });
}

function stubFetch({ body }: { body: unknown }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
  );
}
