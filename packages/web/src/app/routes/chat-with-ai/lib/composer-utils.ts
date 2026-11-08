import { isNil, isObject, tryCatchSync } from '@activepieces/core-utils';

function findSecrets(text: string): string[] {
  const found = SECRET_PATTERNS.flatMap((pattern) =>
    Array.from(text.matchAll(pattern), (match) => match[0]),
  ).filter((candidate) => isKeyLike({ text, candidate }));
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
  tryCatchSync(() =>
    sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)),
  );
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
  const { data } = tryCatchSync<unknown>(() =>
    JSON.parse(sessionStorage.getItem(DRAFTS_KEY) ?? '{}'),
  );
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
}: {
  text: string;
  candidate: string;
}): boolean {
  if (PREFIXED.test(candidate)) return true;
  const start = text.indexOf(candidate);
  const before = text.slice(Math.max(0, start - 8), start);
  if (/[/.:]$/.test(before)) return false;
  return (
    /[a-z]/.test(candidate) && /[A-Z]/.test(candidate) && /\d/.test(candidate)
  );
}

const DRAFTS_KEY = 'chat:drafts';
const NEW_CHAT_PREFIX = 'new:';
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
