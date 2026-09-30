import { describe, expect, it } from 'vitest';
import { ntfyClient, NtfyMessage } from '../src/lib/common/client';

const decode = (v: unknown) => {
  const m = /^=\?UTF-8\?B\?(.*)\?=$/.exec(String(v));
  return m ? Buffer.from(m[1], 'base64').toString('utf-8') : undefined;
};

function legacyHeaders(p: {
  title: string;
  message: string;
  priority?: string;
  tags?: string[];
  icon?: string;
  actions?: string;
  click?: string;
  delay?: string;
}) {
  return {
    'X-Message': ntfyClient.encodeToRFC2047(p.message),
    'X-Title': ntfyClient.encodeToRFC2047(p.title),
    'X-Priority': p.priority,
    'X-Tags': p.tags?.join(','),
    'X-Icon': p.icon,
    'X-Actions': p.actions,
    'X-Click': p.click,
    'X-Delay': p.delay,
  };
}

describe('buildSendNotificationHeaders (Send Notification)', () => {
  it('does not crash and sends no X-Title when the title is empty', () => {
    expect(() => ntfyClient.buildSendNotificationHeaders({ message: 'hi', title: undefined })).not.toThrow();
    const headers = ntfyClient.buildSendNotificationHeaders({ message: 'hi', title: undefined });
    expect(headers).not.toHaveProperty('X-Title');
    expect(ntfyClient.buildSendNotificationHeaders({ message: 'hi', title: '' })).not.toHaveProperty('X-Title');
    expect(decode(headers['X-Message'])).toBe('hi');
  });

  it('builds the same headers as 0.3.0 when a title is set and no new props are used', () => {
    const input = {
      title: 'Ünïcode title',
      message: 'multi\nline',
      priority: 'high',
      tags: ['a', 'b'],
      icon: 'https://example.com/i.png',
      actions: 'view, Open, https://example.com',
      click: 'https://example.com',
      delay: '30m',
    };
    expect(ntfyClient.buildSendNotificationHeaders(input)).toEqual(legacyHeaders(input));
    expect(ntfyClient.buildSendNotificationHeaders({ ...input, markdown: false, cache: undefined })).toEqual(
      legacyHeaders(input)
    );
  });

  it('sends the new optional headers only when set', () => {
    const headers = ntfyClient.buildSendNotificationHeaders({
      message: 'm',
      attach: ' https://example.com/f.pdf ',
      filename: 'rapport-é.pdf',
      markdown: true,
      email: 'jane@example.com',
      call: '+12223334444',
      sequence_id: 'job-42',
      cache: 'no',
      firebase: 'no',
    });
    expect(headers['X-Attach']).toBe('https://example.com/f.pdf');
    expect(decode(headers['X-Filename'])).toBe('rapport-é.pdf');
    expect(headers['X-Markdown']).toBe('yes');
    expect(headers['X-Email']).toBe('jane@example.com');
    expect(headers['X-Call']).toBe('+12223334444');
    expect(headers['X-Sequence-ID']).toBe('job-42');
    expect(headers['X-Cache']).toBe('no');
    expect(headers['X-Firebase']).toBe('no');
  });

  it('rejects a sequence id ntfy would refuse', () => {
    expect(() => ntfyClient.buildSendNotificationHeaders({ message: 'm', sequence_id: 'has space' })).toThrow(
      /Sequence ID/
    );
  });
});

describe('buildJsonPublishBody', () => {
  it('drops unset fields and types the rest', () => {
    const body = ntfyClient.buildJsonPublishBody({
      topic: ' alerts ',
      message: '**hi**',
      title: '  ',
      priority: '4',
      tags: ['warning', ' ', 'test'],
      actions: '[{"action":"view","label":"Open","url":"https://example.com"}]',
      markdown: true,
      sequence_id: 's1',
      disable_cache: true,
      disable_firebase: false,
    });
    expect(body).toEqual({
      topic: 'alerts',
      message: '**hi**',
      priority: 4,
      tags: ['warning', 'test'],
      actions: [{ action: 'view', label: 'Open', url: 'https://example.com' }],
      markdown: true,
      sequence_id: 's1',
      cache: 'no',
    });
  });

  it('validates priority, actions and topic', () => {
    expect(() => ntfyClient.buildJsonPublishBody({ topic: 't', priority: 6 })).toThrow(/Priority/);
    expect(() => ntfyClient.buildJsonPublishBody({ topic: 't', actions: '{bad' })).toThrow(/JSON array/);
    expect(() => ntfyClient.buildJsonPublishBody({ topic: 't', actions: [{}, {}, {}, {}] })).toThrow(/at most 3/);
    expect(() => ntfyClient.buildJsonPublishBody({ topic: '../v1/account' })).toThrow(/Topic/);
  });
});

describe('validateTopicList / baseUrl', () => {
  it('accepts comma-separated topics and rejects path tricks', () => {
    expect(ntfyClient.validateTopicList(' a , b_2,c-3 ')).toBe('a,b_2,c-3');
    expect(() => ntfyClient.validateTopicList('a,b/json')).toThrow(/Topic/);
    expect(() => ntfyClient.validateTopicList('')).toThrow(/required/);
  });

  it('trims trailing slashes and refuses non-http URLs', () => {
    const auth = (base_url: string) => ({ type: 'CUSTOM_AUTH' as never, props: { base_url, access_token: undefined } });
    expect(ntfyClient.baseUrl(auth(' https://ntfy.example.com/sub/ '))).toBe('https://ntfy.example.com/sub');
    expect(() => ntfyClient.baseUrl(auth('ftp://ntfy.example.com'))).toThrow(/https/);
    expect(() => ntfyClient.baseUrl(auth('ntfy.example.com'))).toThrow(/not a valid URL/);
  });
});

describe('parseNdjson', () => {
  it('parses one message per line and skips blank lines', () => {
    const text =
      '{"id":"a","time":1,"event":"message","topic":"t","message":"x"}\n\n{"id":"b","time":2,"event":"message_clear","topic":"t"}\n';
    expect(ntfyClient.parseNdjson(text).map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('returns [] for an empty body and wraps an already-parsed object', () => {
    expect(ntfyClient.parseNdjson('')).toEqual([]);
    expect(ntfyClient.parseNdjson(undefined)).toEqual([]);
    expect(ntfyClient.parseNdjson({ id: 'a', time: 1, event: 'message', topic: 't' })).toHaveLength(1);
  });

  it('throws on a line that is not JSON', () => {
    expect(() => ntfyClient.parseNdjson('{"id":"a","time":1,"event":"message"}\nnot json')).toThrow(/line 2/);
  });
});

describe('advanceCursor (New Message trigger)', () => {
  const msg = (id: string, time: number, event = 'message'): NtfyMessage => ({ id, time, event, topic: 't' });

  it('emits unseen messages oldest first and skips non-message events', () => {
    const { newItems, cursor } = ntfyClient.advanceCursor({
      cursor: { lastTime: 1000, seen: [] },
      fetched: [msg('b', 1002), msg('a', 1001), msg('c', 1003, 'message_delete')],
    });
    expect(newItems.map((m) => m.id)).toEqual(['a', 'b']);
    expect(cursor.lastTime).toBe(1002);
    expect(cursor.seen.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('does not re-emit messages returned again by the overlap window', () => {
    const first = ntfyClient.advanceCursor({
      cursor: { lastTime: 1000, seen: [] },
      fetched: [msg('a', 1001), msg('b', 1001)],
    });
    const second = ntfyClient.advanceCursor({
      cursor: first.cursor,
      fetched: [msg('a', 1001), msg('b', 1001), msg('c', 1001)],
    });
    expect(second.newItems.map((m) => m.id)).toEqual(['c']);
  });

  it('catches a scheduled message delivered with an earlier time than the newest one', () => {
    const first = ntfyClient.advanceCursor({
      cursor: { lastTime: 1000, seen: [] },
      fetched: [msg('late-writer', 1030)],
    });
    const second = ntfyClient.advanceCursor({
      cursor: first.cursor,
      fetched: [msg('sched', 1020), msg('late-writer', 1030)],
    });
    expect(second.newItems.map((m) => m.id)).toEqual(['sched']);
  });

  it('ignores messages older than the overlap window and keeps the seen list bounded', () => {
    const overlap = ntfyClient.CURSOR_OVERLAP_SECONDS;
    const { newItems, cursor } = ntfyClient.advanceCursor({
      cursor: { lastTime: 5000, seen: [{ id: 'old', time: 5000 - overlap - 10 }, { id: 'recent', time: 4990 }] },
      fetched: [msg('ancient', 100), msg('new', 5000 + overlap + 5)],
    });
    expect(newItems.map((m) => m.id)).toEqual(['new']);
    expect(cursor.seen.map((s) => s.id)).toEqual(['new']);
  });
});

describe('toNtfyError', () => {
  it('turns an ntfy JSON error into a readable message with the status', () => {
    const error = ntfyClient.toNtfyError({
      response: { status: 401, body: { code: 40101, http: 401, error: 'unauthorized' } },
    });
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toMatch(/HTTP 401: unauthorized \(ntfy code 40101\).*Access Token/);
  });

  it('rethrows errors without an HTTP status unchanged', () => {
    const original = new Error('socket hang up');
    expect(ntfyClient.toNtfyError(original)).toBe(original);
  });
});
