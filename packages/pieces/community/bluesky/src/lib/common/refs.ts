import type { AtpAgent } from '@atproto/api';
import { blueskyClient } from './client';

const DID_PATTERN = /^did:(plc:[a-z2-7]{24}|web:[a-zA-Z0-9.%:-]{1,253})$/;
const HANDLE_PATTERN = /^(?=.{3,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/;
const RKEY_PATTERN = /^[a-zA-Z0-9._:~-]{1,512}$/;
const WEB_HOSTS = new Set(['bsky.app', 'www.bsky.app', 'main.bsky.dev', 'staging.bsky.app']);
const POST_COLLECTION = 'app.bsky.feed.post';
const LIST_COLLECTION = 'app.bsky.graph.list';
const WEB_BASE = 'https://bsky.app';
const MAX_LIST_PAGES = 50;

function isDid(value: string): boolean {
  return DID_PATTERN.test(value);
}

function normalizeRepo(raw: string): string {
  const decoded = safeDecode(raw.trim().replace(/^@/, ''));
  if (decoded.startsWith('did:')) {
    if (!isDid(decoded)) {
      throw new Error(`"${raw}" is not a valid Bluesky DID.`);
    }
    return decoded;
  }
  const handle = decoded.toLowerCase();
  if (!HANDLE_PATTERN.test(handle)) {
    throw new Error(`"${raw}" is not a valid Bluesky handle. Use the full handle, for example alice.bsky.social.`);
  }
  return handle;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseRecordInput({
  input,
  collection,
  webSegment,
  label,
}: {
  input: string;
  collection: string;
  webSegment: string;
  label: string;
}): { repo: string; rkey: string } {
  const value = input.trim();
  if (value === '') {
    throw new Error(`The ${label} is empty. Paste a bsky.app link or an at:// URI.`);
  }
  if (value.toLowerCase().startsWith('at://')) {
    const parts = value.slice(5).split(/[?#]/)[0].split('/');
    if (parts.length !== 3 || parts[1] !== collection) {
      throw new Error(`"${value}" is not a ${label} AT-URI. Expected at://<did or handle>/${collection}/<id>.`);
    }
    return { repo: normalizeRepo(parts[0]), rkey: validRkey({ rkey: parts[2], input: value }) };
  }
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    throw new Error(`"${value}" is not a valid ${label} link. Use a link like https://bsky.app/profile/alice.bsky.social/${webSegment}/abc123.`);
  }
  const segments = url.pathname.split('/').filter((segment) => segment !== '');
  if (!WEB_HOSTS.has(url.hostname.toLowerCase()) || segments.length < 4 || segments[0] !== 'profile' || segments[2] !== webSegment) {
    throw new Error(`"${value}" is not a ${label} link. Use a link like https://bsky.app/profile/alice.bsky.social/${webSegment}/abc123 or an at:// URI.`);
  }
  return { repo: normalizeRepo(segments[1]), rkey: validRkey({ rkey: segments[3], input: value }) };
}

function validRkey({ rkey, input }: { rkey: string; input: string }): string {
  if (!RKEY_PATTERN.test(rkey) || rkey === '.' || rkey === '..') {
    throw new Error(`"${input}" has an invalid record id.`);
  }
  return rkey;
}

function parsePostInput(input: string): { repo: string; rkey: string } {
  return parseRecordInput({ input, collection: POST_COLLECTION, webSegment: 'post', label: 'post' });
}

function parseListInput(input: string): { repo: string; rkey: string } {
  return parseRecordInput({ input, collection: LIST_COLLECTION, webSegment: 'lists', label: 'list' });
}

function parseActorInput(input: string): string {
  const value = input.trim();
  if (value === '') {
    throw new Error('The account is empty. Enter a handle (alice.bsky.social), a DID or a profile link.');
  }
  if (/^https?:\/\//i.test(value) || /^(www\.)?bsky\.app\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    } catch {
      throw new Error(`"${value}" is not a valid profile link.`);
    }
    const segments = url.pathname.split('/').filter((segment) => segment !== '');
    if (!WEB_HOSTS.has(url.hostname.toLowerCase()) || segments.length < 2 || segments[0] !== 'profile') {
      throw new Error(`"${value}" is not a Bluesky profile link. Use a link like https://bsky.app/profile/alice.bsky.social.`);
    }
    return normalizeRepo(segments[1]);
  }
  const bare = value.replace(/^@/, '');
  if (!bare.startsWith('did:') && !bare.includes('.')) {
    return normalizeRepo(`${bare}.bsky.social`);
  }
  return normalizeRepo(bare);
}

async function resolveRepoDid({ agent, repo }: { agent: AtpAgent; repo: string }): Promise<string> {
  if (isDid(repo)) {
    return repo;
  }
  try {
    const response = await agent.resolveHandle({ handle: repo });
    return response.data.did;
  } catch (resolveError) {
    try {
      const profile = await agent.getProfile({ actor: repo });
      return profile.data.did;
    } catch {
      throw resolveError;
    }
  }
}

async function resolvePostRef({ agent, input }: { agent: AtpAgent; input: string }): Promise<PostRef> {
  const { repo, rkey } = parsePostInput(input);
  const did = await resolveRepoDid({ agent, repo });
  return { uri: `at://${did}/${POST_COLLECTION}/${rkey}`, did, rkey };
}

async function resolveListRef({ agent, input }: { agent: AtpAgent; input: string }): Promise<PostRef> {
  const { repo, rkey } = parseListInput(input);
  const did = await resolveRepoDid({ agent, repo });
  return { uri: `at://${did}/${LIST_COLLECTION}/${rkey}`, did, rkey };
}

async function resolveActorDid({ agent, input }: { agent: AtpAgent; input: string }): Promise<string> {
  return resolveRepoDid({ agent, repo: parseActorInput(input) });
}

async function fetchProfile({ agent, input }: { agent: AtpAgent; input?: string }) {
  const actor = input && input.trim() !== '' ? parseActorInput(input) : agent.session?.did;
  if (!actor) {
    throw new Error('The Bluesky session has no account DID. Reconnect the Bluesky connection.');
  }
  const response = await agent.getProfile({ actor });
  return response.data;
}

async function listMembers({ agent, listUri, maxPages = MAX_LIST_PAGES }: { agent: AtpAgent; listUri: string; maxPages?: number }) {
  const pages: Awaited<ReturnType<typeof agent.app.bsky.graph.getList>>['data'][] = [];
  let cursor: string | undefined = undefined;
  for (let page = 0; page < maxPages; page++) {
    const response: Awaited<ReturnType<typeof agent.app.bsky.graph.getList>> = await agent.app.bsky.graph.getList({ list: listUri, limit: 100, cursor });
    pages.push(response.data);
    if (!response.data.cursor || response.data.cursor === cursor) {
      return { items: pages.flatMap((p) => p.items), complete: true };
    }
    cursor = response.data.cursor;
  }
  return { items: pages.flatMap((p) => p.items), complete: false };
}

async function recordExists({ agent, repo, collection, rkey }: { agent: AtpAgent; repo: string; collection: string; rkey: string }): Promise<boolean> {
  try {
    await agent.com.atproto.repo.getRecord({ repo, collection, rkey });
    return true;
  } catch (error) {
    if (blueskyClient.isXrpcError(error) && (error.error === 'RecordNotFound' || error.status === 404 || /could not locate record/i.test(error.message))) {
      return false;
    }
    throw error;
  }
}

function parseAtUri(uri: string): { repo: string; collection: string; rkey: string } | null {
  if (!uri.startsWith('at://')) {
    return null;
  }
  const parts = uri.slice(5).split('/');
  if (parts.length !== 3) {
    return null;
  }
  return { repo: parts[0], collection: parts[1], rkey: parts[2] };
}

function profileWebUrl(actor: string): string {
  return `${WEB_BASE}/profile/${actor}`;
}

function postWebUrl({ uri, handle }: { uri: string; handle?: string }): string {
  const parsed = parseAtUri(uri);
  if (parsed === null) {
    return '';
  }
  const actor = handle && handle !== 'handle.invalid' ? handle : parsed.repo;
  const segment = parsed.collection === LIST_COLLECTION ? 'lists' : 'post';
  return `${profileWebUrl(actor)}/${segment}/${parsed.rkey}`;
}

export const blueskyRefs = {
  isDid,
  parsePostInput,
  parseListInput,
  parseActorInput,
  parseAtUri,
  resolvePostRef,
  resolveListRef,
  resolveActorDid,
  resolveRepoDid,
  fetchProfile,
  listMembers,
  recordExists,
  postWebUrl,
  profileWebUrl,
  POST_COLLECTION,
  LIST_COLLECTION,
};

export type PostRef = { uri: string; did: string; rkey: string };
