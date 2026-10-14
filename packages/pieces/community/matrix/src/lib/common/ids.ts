import { randomUUID } from 'crypto';

const CLIENT_PREFIX = '/_matrix/client/v3';

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function check({ value, sigil, label, example, needsServer }: { value: unknown; sigil: string; label: string; example: string; needsServer: boolean }): string {
  const text = clean(value);
  const body = text.slice(1);
  const valid =
    text.startsWith(sigil) &&
    body.length > 0 &&
    text.length <= 255 &&
    !/[\s/]/.test(text) &&
    (!needsServer || /^[^:]+:[^:].*$/.test(body));
  if (!valid) {
    throw new Error(`${label} must look like ${example}.`);
  }
  return text;
}

function roomId(value: unknown): string {
  return check({ value, sigil: '!', label: 'Room ID', example: '!abc123:example.org', needsServer: false });
}

function roomAlias(value: unknown): string {
  return check({ value, sigil: '#', label: 'Room alias', example: '#room:example.org', needsServer: true });
}

function roomIdOrAlias(value: unknown): string {
  const text = clean(value);
  if (text.startsWith('#')) return roomAlias(text);
  if (text.startsWith('!')) return roomId(text);
  throw new Error('Room must be a room ID like !abc123:example.org or an alias like #room:example.org.');
}

function userId(value: unknown): string {
  return check({ value, sigil: '@', label: 'User ID', example: '@alice:example.org', needsServer: true });
}

function eventId(value: unknown): string {
  return check({ value, sigil: '$', label: 'Event ID', example: '$AbC123', needsServer: false });
}

function transactionId(value: unknown): string {
  const text = clean(value);
  if (text === '') return `ap-${randomUUID()}`;
  if (!/^[A-Za-z0-9._~-]{1,128}$/.test(text)) {
    throw new Error('Transaction ID may only contain letters, digits and . _ ~ - (max 128 characters).');
  }
  return text;
}

function clientPath(...segments: string[]): string {
  return `${CLIENT_PREFIX}/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

export const matrixIds = {
  roomId,
  roomAlias,
  roomIdOrAlias,
  userId,
  eventId,
  transactionId,
  clientPath,
};
