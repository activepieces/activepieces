const OPEN_SPOTIFY_HOSTS = new Set(['open.spotify.com', 'play.spotify.com']);
const BASE62_ID = /^[A-Za-z0-9]{1,64}$/;
const USER_ID = /^[A-Za-z0-9._~-]{1,128}$/;
const INTL_SEGMENT = /^intl-[a-z]{2}(?:-[a-z]{2})?$/i;

export const SPOTIFY_KINDS = ['track', 'album', 'artist', 'playlist', 'show', 'episode', 'audiobook', 'user'] as const;

export const SPOTIFY_LIBRARY_WRITE_KINDS: readonly SpotifyKind[] = SPOTIFY_KINDS.filter((kind) => kind !== 'artist');

function idPattern(kind: SpotifyKind): RegExp {
  return kind === 'user' ? USER_ID : BASE62_ID;
}

function describeKinds(kinds: readonly SpotifyKind[]): string {
  return kinds.join(', ');
}

function fromLink({ text, kinds }: { text: string; kinds: readonly SpotifyKind[] }): { kind: SpotifyKind; id: string } | null {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !OPEN_SPOTIFY_HOSTS.has(url.hostname.toLowerCase()) || url.username !== '' || url.password !== '') {
    throw new Error(`"${text.slice(0, 120)}" is not a Spotify link. Use an ID, a spotify: URI or an https://open.spotify.com link.`);
  }
  const parts = url.pathname.split('/').filter((part) => part !== '');
  const rest = parts.length > 0 && INTL_SEGMENT.test(parts[0]) ? parts.slice(1) : parts;
  const kind = kinds.find((candidate) => candidate === rest[0]);
  if (kind === undefined || rest.length !== 2) {
    throw new Error(`"${text.slice(0, 120)}" is not a Spotify ${describeKinds(kinds)} link.`);
  }
  let id: string;
  try {
    id = decodeURIComponent(rest[1]);
  } catch {
    throw new Error(`"${text.slice(0, 120)}" is not a valid Spotify ${describeKinds(kinds)} link.`);
  }
  return { kind, id };
}

function fromUri({ text, kinds }: { text: string; kinds: readonly SpotifyKind[] }): { kind: SpotifyKind; id: string } | null {
  if (!text.startsWith('spotify:')) {
    return null;
  }
  const parts = text.split(':');
  const kind = kinds.find((candidate) => candidate === parts[1]);
  if (kind === undefined || parts.length !== 3) {
    throw new Error(`"${text.slice(0, 120)}" is not a Spotify ${describeKinds(kinds)} URI.`);
  }
  return { kind, id: parts[2] };
}

function resolve({ value, kinds, label }: { value: unknown; kinds: readonly SpotifyKind[]; label: string }): { kind: SpotifyKind; id: string } {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  if (text === '') {
    throw new Error(`${label} is required.`);
  }
  const parsed = fromUri({ text, kinds }) ?? fromLink({ text, kinds });
  if (parsed !== null) {
    if (!idPattern(parsed.kind).test(parsed.id)) {
      throw new Error(`"${text.slice(0, 120)}" does not contain a valid Spotify ${parsed.kind} ID.`);
    }
    return parsed;
  }
  if (kinds.length !== 1) {
    throw new Error(`"${text.slice(0, 120)}" is not a Spotify URI. Use a URI like spotify:${kinds[0]}:<id> or an https://open.spotify.com/${kinds[0]}/<id> link (allowed types: ${describeKinds(kinds)}).`);
  }
  if (!idPattern(kinds[0]).test(text)) {
    throw new Error(`"${text.slice(0, 120)}" is not a valid Spotify ${kinds[0]} ID, URI or open.spotify.com link.`);
  }
  return { kind: kinds[0], id: text };
}

function toList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => (typeof entry === 'string' ? entry.split(/[\n,]/) : [entry]));
  }
  if (typeof value === 'string') {
    return value.split(/[\n,]/);
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

export const spotifyIds = {
  parse({ kind, value, label }: { kind: SpotifyKind; value: unknown; label?: string }): string {
    return resolve({ value, kinds: [kind], label: label ?? `Spotify ${kind} ID` }).id;
  },
  segment({ kind, value, label }: { kind: SpotifyKind; value: unknown; label?: string }): string {
    return encodeURIComponent(spotifyIds.parse({ kind, value, label }));
  },
  toUri({ kind, id }: { kind: SpotifyKind; id: string }): string {
    return `spotify:${kind}:${id}`;
  },
  parseUri({ value, kinds, label }: { value: unknown; kinds: readonly SpotifyKind[]; label?: string }): string {
    const parsed = resolve({ value, kinds, label: label ?? 'Spotify URI' });
    return spotifyIds.toUri(parsed);
  },
  parseUriList({ value, kinds, label, allowLocal }: { value: unknown; kinds: readonly SpotifyKind[]; label: string; allowLocal?: boolean }): string[] {
    const entries = toList(value)
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry) => entry !== '' && entry !== undefined && entry !== null);
    return entries.map((entry) => {
      if (allowLocal === true && typeof entry === 'string' && entry.startsWith('spotify:local:')) {
        return entry;
      }
      return spotifyIds.parseUri({ value: entry, kinds, label });
    });
  },
  parseIdList({ value, kind, label }: { value: unknown; kind: SpotifyKind; label: string }): string[] {
    return toList(value)
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry) => entry !== '' && entry !== undefined && entry !== null)
      .map((entry) => spotifyIds.parse({ kind, value: entry, label }));
  },
};

export type SpotifyKind = (typeof SPOTIFY_KINDS)[number];
