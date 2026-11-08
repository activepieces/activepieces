import { isNil, isObject } from '@activepieces/core-utils';

import { safeStorage } from '@/lib/safe-storage';

function findSecrets(text: string): string[] {
  const found = SECRET_PATTERNS.flatMap((pattern) =>
    Array.from(text.matchAll(pattern)).filter((match) =>
      isKeyLike({ text, candidate: match[0], start: match.index ?? 0 }),
    ),
  ).map((match) => match[0]);
  return Array.from(new Set(found));
}

function removeSecrets(text: string): string {
  return findSecrets(text)
    .reduce((rest, secret) => rest.split(secret).join(''), text)
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function readDraft(key: string): string {
  return readAll()[key] ?? '';
}

function writeDraft({ key, text }: { key: string; text: string }): void {
  const drafts = { ...readAll() };
  if (text.trim().length === 0 || findSecrets(text).length > 0) {
    delete drafts[key];
  } else {
    drafts[key] = text;
  }
  safeStorage.writeJson({ area: 'session', key: DRAFTS_KEY, value: drafts });
}

function joinQueued({ queued, next }: { queued: string; next: string }) {
  return [queued, next].filter((part) => part.length > 0).join('\n\n');
}

function draftKeyFor({
  conversationId,
  agentId,
}: {
  conversationId: string | null | undefined;
  agentId: string | undefined;
}): string {
  if (!isNil(conversationId)) return conversationId;
  return isNil(agentId)
    ? `${NEW_CHAT_PREFIX}chat`
    : `${NEW_CHAT_PREFIX}agent:${agentId}`;
}

function isNewChatKey(key: string | undefined): boolean {
  return !isNil(key) && key.startsWith(NEW_CHAT_PREFIX);
}

function readAll(): Record<string, string> {
  const data = safeStorage.readJson({ area: 'session', key: DRAFTS_KEY });
  if (!isObject(data)) return {};
  return Object.fromEntries(
    Object.entries(data).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

function isKeyLike({
  text,
  candidate,
  start,
}: {
  text: string;
  candidate: string;
  start: number;
}): boolean {
  if (PREFIXED.test(candidate)) return true;
  const before = text.slice(0, start);
  const after = text.slice(start + candidate.length);
  if (/[/.:]$/.test(before) || after.startsWith('/')) return false;
  if (DATA_URI_BEFORE.test(before)) return false;
  if (HEX_OR_UUID.test(candidate) || CONTENT_HASH.test(candidate)) {
    return false;
  }
  if (candidate.length > MAX_GENERIC_SECRET_LENGTH) return false;
  return (
    /[a-z]/.test(candidate) && /[A-Z]/.test(candidate) && /\d/.test(candidate)
  );
}

const DRAFTS_KEY = 'chat:drafts';
const NEW_CHAT_PREFIX = 'new:';
const MAX_GENERIC_SECRET_LENGTH = 128;
const DATA_URI_BEFORE = /data:[\w/+.-]*;base64,[A-Za-z0-9+/=]*$/;
const HEX_OR_UUID = /^[0-9a-fA-F-]+$/;
const CONTENT_HASH = /^sha(1|256|384|512)-/;
const PREFIXED = /^(sk-|gh[pousr]_|xox[bpoas]-)/;
const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{16,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bxox[bpoas]-[A-Za-z0-9-]{10,}/g,
  /[A-Za-z0-9+=_-]{32,}/g,
];

export const composerUtils = {
  findSecrets,
  removeSecrets,
  readDraft,
  writeDraft,
  joinQueued,
  draftKeyFor,
  isNewChatKey,
  DRAFTS_KEY,
};
