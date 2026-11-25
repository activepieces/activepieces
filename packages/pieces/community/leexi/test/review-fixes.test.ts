import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError } from '@activepieces/pieces-common';
import { leexiAuth } from '../src/lib/common/auth';
import { newCallCreatedTrigger } from '../src/lib/triggers/new-call-created';
import { listCallNotesAction } from '../src/lib/actions/list-call-notes';

const auth = { username: 'id', password: 'secret' };
const server = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };

describe('leexi auth validate', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('checks the key against /calls with one item so a read_calls-only key connects', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { data: [] } });
    const result = await leexiAuth.validate?.({ auth, server });
    expect(result).toEqual({ valid: true });
    expect(spy.mock.calls[0][0].url).toBe('https://public-api.leexi.ai/v1/calls?items=1');
  });

  it('names the read_calls scope on 403', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 403, responseBody: {} }));
    const result = await leexiAuth.validate?.({ auth, server });
    expect(result).toEqual({ valid: false, error: expect.stringContaining('read_calls') });
  });
});

describe('new call created output schema', () => {
  it('keeps speakers and drops the empty simple_transcript', () => {
    const keys = (newCallCreatedTrigger.outputSchema?.fields ?? []).map((field) => field.key);
    expect(keys).toContain('speakers');
    expect(keys).not.toContain('simple_transcript');
  });
});

describe('list call notes metadata', () => {
  it('tells the agent only the first locale is returned', () => {
    expect(listCallNotesAction.aiMetadata?.description).toContain('first locale of each note only');
  });
});
