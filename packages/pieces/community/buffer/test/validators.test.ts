import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bufferAiProps, BUFFER_ENUMS } from '../src/lib/common/ai-props';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isoDate', () => {
  it('accepts ISO with Z or an offset and normalises to UTC', () => {
    expect(bufferAiProps.isoDate({ value: '2026-12-01T09:00:00Z', label: 'X', future: true })).toBe('2026-12-01T09:00:00.000Z');
    expect(bufferAiProps.isoDate({ value: '2026-12-01T11:00:00+02:00', label: 'X', future: true })).toBe('2026-12-01T09:00:00.000Z');
  });

  it('rejects a date with no timezone, a natural-language date and an impossible day', () => {
    expect(() => bufferAiProps.isoDate({ value: '2026-12-01T09:00:00', label: 'X', future: true })).toThrow('with a timezone');
    expect(() => bufferAiProps.isoDate({ value: 'tomorrow 9am', label: 'X', future: true })).toThrow('not a valid ISO 8601');
    expect(() => bufferAiProps.isoDate({ value: '2027-02-30T09:00:00Z', label: 'X', future: true })).toThrow('not a valid ISO 8601');
  });

  it('rejects a past time only when a future time is required', () => {
    expect(() => bufferAiProps.isoDate({ value: '2026-11-10T11:59:00Z', label: 'X', future: true })).toThrow('not in the future');
    expect(bufferAiProps.isoDate({ value: '2026-11-10T11:59:00Z', label: 'X', future: false })).toBe('2026-11-10T11:59:00.000Z');
  });

  it('treats empty as not given', () => {
    expect(bufferAiProps.isoDate({ value: '  ', label: 'X', future: true })).toBeUndefined();
  });
});

describe('id and list helpers', () => {
  it('trims ids and requires them', () => {
    expect(bufferAiProps.requiredId({ value: ' abc ', label: 'Post ID' })).toBe('abc');
    expect(() => bufferAiProps.requiredId({ value: ' ', label: 'Post ID' })).toThrow('Post ID is required.');
  });

  it('accepts arrays or comma text, dedupes, and rejects a blank entry among real ones', () => {
    expect(bufferAiProps.idList({ value: ['a', ' b', 'a'], label: 'L' })).toEqual(['a', 'b']);
    expect(bufferAiProps.idList({ value: 'a, b', label: 'L' })).toEqual(['a', 'b']);
    expect(bufferAiProps.idList({ value: [], label: 'L' })).toBeUndefined();
    expect(bufferAiProps.idList({ value: [''], label: 'L' })).toBeUndefined();
    expect(() => bufferAiProps.idList({ value: ['a', ''], label: 'L' })).toThrow('empty entry');
  });

  it('checks enum values against the allow-list', () => {
    expect(bufferAiProps.manyOf({ value: ['sent', 'draft'], allowed: BUFFER_ENUMS.POST_STATUSES, label: 'Status' })).toEqual(['sent', 'draft']);
    expect(() => bufferAiProps.manyOf({ value: ['pending'], allowed: BUFFER_ENUMS.POST_STATUSES, label: 'Status' })).toThrow('"pending"');
    expect(() => bufferAiProps.oneOf({ value: 'now', allowed: BUFFER_ENUMS.SHARE_MODES, label: 'Share Mode' })).toThrow('must be one of');
  });

  it('clamps page size to 1..100 with a default of 20', () => {
    expect(bufferAiProps.pageSize(undefined)).toBe(20);
    expect(bufferAiProps.pageSize(100)).toBe(100);
    expect(() => bufferAiProps.pageSize(0)).toThrow('1 to 100');
    expect(() => bufferAiProps.pageSize(101)).toThrow('1 to 100');
    expect(() => bufferAiProps.pageSize(2.5)).toThrow('1 to 100');
  });

  it('accepts only http(s) URLs for agent media', () => {
    expect(bufferAiProps.urlList({ value: [' https://x.io/a.png ', ''], label: 'Image URL' })).toEqual(['https://x.io/a.png']);
    expect(() => bufferAiProps.urlList({ value: ['ftp://x.io/a.png'], label: 'Image URL' })).toThrow('http');
    expect(() => bufferAiProps.urlList({ value: ['not a url'], label: 'Image URL' })).toThrow('not a valid URL');
  });

  it('parses metadata JSON objects and refuses arrays', () => {
    expect(bufferAiProps.jsonObject({ value: '{"facebook":{"type":"post"}}', label: 'M' })).toEqual({ facebook: { type: 'post' } });
    expect(bufferAiProps.jsonObject({ value: {}, label: 'M' })).toBeUndefined();
    expect(() => bufferAiProps.jsonObject({ value: [1], label: 'M' })).toThrow('JSON object');
    expect(() => bufferAiProps.jsonObject({ value: '{', label: 'M' })).toThrow('not valid JSON');
  });
});

describe('postContentFor', () => {
  it('puts a link into metadata.<service>.linkAttachment on card services without images (assets.link is deprecated)', () => {
    const content = bufferAiProps.postContentFor({ service: 'linkedin', text: 'hi', images: [], link: 'https://a.io' });
    expect(content).toEqual({ text: 'hi', assets: [], metadata: { linkedin: { linkAttachment: { url: 'https://a.io' } } } });
  });

  it('adds the required Facebook post type and keeps caller metadata', () => {
    const content = bufferAiProps.postContentFor({ service: 'facebook', text: 'hi', images: [], link: 'https://a.io', metadata: { facebook: { firstComment: 'c' } } });
    expect(content.metadata).toEqual({ facebook: { type: 'post', firstComment: 'c', linkAttachment: { url: 'https://a.io' } } });
  });

  it('appends the link to the text when images are attached or the service has no link card', () => {
    expect(bufferAiProps.postContentFor({ service: 'bluesky', text: 'hi', images: ['https://i.io/1.png'], link: 'https://a.io' })).toEqual({
      text: 'hi\n\nhttps://a.io',
      assets: [{ image: { url: 'https://i.io/1.png' } }],
      metadata: undefined,
    });
    expect(bufferAiProps.postContentFor({ service: 'twitter', text: 'see https://a.io', images: [], link: 'https://a.io' }).text).toBe('see https://a.io');
    expect(bufferAiProps.postContentFor({ service: undefined, text: undefined, images: [], link: 'https://a.io' }).text).toBe('https://a.io');
  });
});

describe('isoDate edge cases (QA)', () => {
  it('accepts a compact offset and lower-case z, and rejects an out-of-range minute', () => {
    expect(bufferAiProps.isoDate({ value: '2026-12-01T11:00:00+0200', label: 'X', future: true })).toBe('2026-12-01T09:00:00.000Z');
    expect(bufferAiProps.isoDate({ value: '2026-12-01t09:00z', label: 'X', future: true })).toBe('2026-12-01T09:00:00.000Z');
    expect(() => bufferAiProps.isoDate({ value: '2026-12-01T09:60:00Z', label: 'X', future: true })).toThrow('not a valid ISO 8601');
    expect(() => bufferAiProps.isoDate({ value: '2026-13-01T09:00:00Z', label: 'X', future: true })).toThrow('not a valid ISO 8601');
  });

  it('rejects a date-only value and a non-string value', () => {
    expect(() => bufferAiProps.isoDate({ value: '2026-12-01', label: 'X', future: true })).toThrow('with a timezone');
    expect(bufferAiProps.isoDate({ value: { a: 1 }, label: 'X', future: true })).toBeUndefined();
  });
});
