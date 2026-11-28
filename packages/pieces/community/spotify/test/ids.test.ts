import { describe, expect, test } from 'vitest';
import { spotifyIds } from '../src/lib/common/ids';

const ID = '4cOdK2wGLETKBW3PvgPWqT';

describe('spotifyIds.parse', () => {
  test('bare ID', () => {
    expect(spotifyIds.parse({ kind: 'track', value: ID })).toBe(ID);
  });

  test('trims whitespace', () => {
    expect(spotifyIds.parse({ kind: 'track', value: `  ${ID}\n` })).toBe(ID);
  });

  test('spotify URI', () => {
    expect(spotifyIds.parse({ kind: 'track', value: `spotify:track:${ID}` })).toBe(ID);
  });

  test('open.spotify.com link with si query', () => {
    expect(spotifyIds.parse({ kind: 'playlist', value: `https://open.spotify.com/playlist/${ID}?si=abc123` })).toBe(ID);
  });

  test('intl-xx link', () => {
    expect(spotifyIds.parse({ kind: 'album', value: `https://open.spotify.com/intl-de/album/${ID}` })).toBe(ID);
    expect(spotifyIds.parse({ kind: 'album', value: `https://open.spotify.com/intl-pt-br/album/${ID}?si=x` })).toBe(ID);
  });

  test('wrong kind in URI is rejected', () => {
    expect(() => spotifyIds.parse({ kind: 'playlist', value: `spotify:track:${ID}` })).toThrow(/not a Spotify playlist URI/);
  });

  test('wrong kind in link is rejected', () => {
    expect(() => spotifyIds.parse({ kind: 'playlist', value: `https://open.spotify.com/track/${ID}` })).toThrow(/not a Spotify playlist link/);
  });

  test('lookalike host is rejected', () => {
    expect(() => spotifyIds.parse({ kind: 'track', value: `https://open.spotify.com.evil.io/track/${ID}` })).toThrow(/not a Spotify link/);
  });

  test('http scheme and credentials are rejected', () => {
    expect(() => spotifyIds.parse({ kind: 'track', value: `http://open.spotify.com/track/${ID}` })).toThrow(/not a Spotify link/);
    expect(() => spotifyIds.parse({ kind: 'track', value: `https://user:pw@open.spotify.com/track/${ID}` })).toThrow(/not a Spotify link/);
  });

  test('path traversal and separators are rejected', () => {
    expect(() => spotifyIds.parse({ kind: 'playlist', value: '../me' })).toThrow(/not a valid Spotify playlist ID/);
    expect(() => spotifyIds.parse({ kind: 'playlist', value: 'abc/items' })).toThrow(/not a valid Spotify playlist ID/);
    expect(() => spotifyIds.parse({ kind: 'playlist', value: 'abc?x=1' })).toThrow(/not a valid Spotify playlist ID/);
  });

  test('a malformed percent sequence in a link gives a friendly error', () => {
    expect(() => spotifyIds.parse({ kind: 'track', value: 'https://open.spotify.com/track/%E0%A4%A' })).toThrow(/not a valid Spotify track link/);
  });

  test('empty value is rejected with the label', () => {
    expect(() => spotifyIds.parse({ kind: 'track', value: '', label: 'Track ID' })).toThrow('Track ID is required.');
    expect(() => spotifyIds.parse({ kind: 'track', value: undefined, label: 'Track ID' })).toThrow('Track ID is required.');
  });

  test('user IDs may contain dots', () => {
    expect(spotifyIds.parseUri({ value: 'spotify:user:pat.lee', kinds: ['user'] })).toBe('spotify:user:pat.lee');
  });
});

describe('spotifyIds.segment', () => {
  test('returns an encoded path segment', () => {
    expect(spotifyIds.segment({ kind: 'user', value: 'pat~lee' })).toBe(encodeURIComponent('pat~lee'));
    expect(spotifyIds.segment({ kind: 'playlist', value: ID })).toBe(ID);
  });
});

describe('spotifyIds.parseUriList', () => {
  test('normalises links and URIs, splits comma and newline strings', () => {
    expect(
      spotifyIds.parseUriList({
        value: [`https://open.spotify.com/track/${ID}`, `spotify:episode:${ID}, spotify:track:${ID}\n`, ''],
        kinds: ['track', 'episode'],
        label: 'Items',
      })
    ).toEqual([`spotify:track:${ID}`, `spotify:episode:${ID}`, `spotify:track:${ID}`]);
  });

  test('bare IDs are rejected when several kinds are allowed', () => {
    expect(() => spotifyIds.parseUriList({ value: [ID], kinds: ['track', 'episode'], label: 'Items' })).toThrow(/not a Spotify URI/);
  });

  test('a kind outside the allowed list is rejected', () => {
    expect(() => spotifyIds.parseUriList({ value: [`spotify:album:${ID}`], kinds: ['track', 'episode'], label: 'Items' })).toThrow(/track, episode URI/);
  });

  test('local files pass only when allowed', () => {
    const local = 'spotify:local:Artist:Album:Title:180';
    expect(spotifyIds.parseUriList({ value: [local], kinds: ['track'], label: 'Items', allowLocal: true })).toEqual([local]);
    expect(() => spotifyIds.parseUriList({ value: [local], kinds: ['track'], label: 'Items' })).toThrow();
  });
});
