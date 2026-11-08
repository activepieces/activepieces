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

  it('ignores long ids, hashes and base64 data', () => {
    expect(
      composerUtils.findSecrets(
        'commit 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      ),
    ).toEqual([]);
    expect(
      composerUtils.findSecrets(
        'run 9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08',
      ),
    ).toEqual([]);
    expect(
      composerUtils.findSecrets(
        'integrity sha384-oqVuAfXRKap7fdgcCY5uykM6Pwy1W6wMqzCO9Wm5TwM8b1DQq4',
      ),
    ).toEqual([]);
    expect(
      composerUtils.findSecrets(
        'img data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ),
    ).toEqual([]);
    expect(
      composerUtils.findSecrets(
        'img data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB/CAYAAAAfFcSJAAAADUlEQVR42mNkM9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ),
    ).toEqual([]);
    expect(composerUtils.findSecrets(`blob ${'aB3'.repeat(60)} end`)).toEqual(
      [],
    );
  });

  it('still flags a mixed key at the end of a sentence', () => {
    expect(
      composerUtils.findSecrets(
        'my key is AKIAabcdEFGH1234ijklMNOP5678qrstUVWX.',
      ),
    ).toEqual(['AKIAabcdEFGH1234ijklMNOP5678qrstUVWX']);
    expect(
      composerUtils.findSecrets(
        'token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc',
      ),
    ).toEqual(['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9']);
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
