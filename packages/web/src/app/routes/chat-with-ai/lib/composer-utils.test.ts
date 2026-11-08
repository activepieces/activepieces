// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { composerUtils } from './composer-utils';

describe('composerUtils.findSecrets', () => {
  it('flags prefixed keys', () => {
    expect(
      composerUtils.findSecrets('use sk-proj-abcdefghijklmnop1234 please'),
    ).toEqual(['sk-proj-abcdefghijklmnop1234']);
    expect(
      composerUtils.findSecrets('ghp_ABCDEFGHIJKLMNOPQRSTuvwx1234'),
    ).toEqual(['ghp_ABCDEFGHIJKLMNOPQRSTuvwx1234']);
    expect(composerUtils.findSecrets('xoxb-1234567890-abcdef')).toEqual([
      'xoxb-1234567890-abcdef',
    ]);
  });

  it('flags long mixed base64-ish runs', () => {
    expect(
      composerUtils.findSecrets('key AKIAabcdEFGH1234ijklMNOP5678qrstUVWX'),
    ).toEqual(['AKIAabcdEFGH1234ijklMNOP5678qrstUVWX']);
  });

  it('ignores ordinary text, uuids and url paths', () => {
    expect(composerUtils.findSecrets('Make a table of my competitors')).toEqual(
      [],
    );
    expect(
      composerUtils.findSecrets('id 123e4567-e89b-12d3-a456-426614174000'),
    ).toEqual([]);
    expect(
      composerUtils.findSecrets(
        'see https://cloud.activepieces.com/projects/9PQCZhbYYBarIbfrVcSu6abcdefGHIJ123',
      ),
    ).toEqual([]);
    expect(composerUtils.findSecrets('sk-short')).toEqual([]);
  });
});

describe('composerUtils.removeSecrets', () => {
  it('deletes the matched text only', () => {
    expect(
      composerUtils.removeSecrets(
        'my key is sk-proj-abcdefghijklmnop1234 thanks',
      ),
    ).toBe('my key is thanks');
  });
});

describe('composerUtils drafts', () => {
  beforeEach(() => sessionStorage.clear());

  it('keeps one draft per key', () => {
    composerUtils.writeDraft({ key: 'a', text: 'hello' });
    composerUtils.writeDraft({ key: 'b', text: 'world' });
    expect(composerUtils.readDraft('a')).toBe('hello');
    expect(composerUtils.readDraft('b')).toBe('world');
  });

  it('clears empty drafts and never stores a flagged draft', () => {
    composerUtils.writeDraft({ key: 'a', text: 'hello' });
    composerUtils.writeDraft({ key: 'a', text: '  ' });
    expect(composerUtils.readDraft('a')).toBe('');
    composerUtils.writeDraft({
      key: 'a',
      text: 'my key sk-proj-abcdefghijklmnop1234',
    });
    expect(composerUtils.readDraft('a')).toBe('');
    expect(sessionStorage.getItem(composerUtils.DRAFTS_KEY)).not.toContain(
      'sk-proj',
    );
  });

  it('survives bad storage', () => {
    sessionStorage.setItem(composerUtils.DRAFTS_KEY, '{not json');
    expect(composerUtils.readDraft('a')).toBe('');
  });
});

describe('composerUtils.joinQueued', () => {
  it('appends with a blank line', () => {
    expect(composerUtils.joinQueued({ queued: 'a', next: 'b' })).toBe('a\n\nb');
    expect(composerUtils.joinQueued({ queued: '', next: 'b' })).toBe('b');
  });
});

describe('composerUtils.draftKeyFor', () => {
  it('uses the conversation id, or a new-chat key', () => {
    expect(
      composerUtils.draftKeyFor({ conversationId: 'abc', agentId: undefined }),
    ).toBe('abc');
    const fresh = composerUtils.draftKeyFor({
      conversationId: null,
      agentId: undefined,
    });
    expect(composerUtils.isNewChatKey(fresh)).toBe(true);
    expect(composerUtils.isNewChatKey('abc')).toBe(false);
  });
});
