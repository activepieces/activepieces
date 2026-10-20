import { HttpMethod } from '@activepieces/pieces-common';
import { matrixClient, MatrixApiError, MatrixAuthValue } from './client';
import { matrixIds } from './ids';
import { matrixMarkdown } from './markdown';

const MSG_TYPES = ['m.text', 'm.notice', 'm.emote'];

async function resolveAlias({ auth, alias }: { auth: MatrixAuthValue; alias: string }): Promise<{ roomId: string; servers: string[] }> {
  const body = await matrixClient.request({
    auth,
    method: HttpMethod.GET,
    path: matrixIds.clientPath('directory', 'room', matrixIds.roomAlias(alias)),
  });
  const record = matrixClient.isRecord(body) ? body : {};
  const roomId = record['room_id'];
  if (typeof roomId !== 'string') {
    throw new Error(`The homeserver did not return a room ID for ${alias}.`);
  }
  return { roomId, servers: matrixClient.arrayOf(record['servers']).filter((s): s is string => typeof s === 'string') };
}

async function resolveRoom({ auth, room }: { auth: MatrixAuthValue; room: unknown }): Promise<string> {
  const value = matrixIds.roomIdOrAlias(room);
  if (value.startsWith('!')) return value;
  return (await resolveAlias({ auth, alias: value })).roomId;
}

async function buildTextContent({ text, msgtype, format }: { text: string; msgtype: string; format: string }): Promise<Record<string, unknown>> {
  if (!MSG_TYPES.includes(msgtype)) {
    throw new Error(`Message type must be one of ${MSG_TYPES.join(', ')}.`);
  }
  const content: Record<string, unknown> = { msgtype, body: text };
  if (format === 'markdown') {
    content['format'] = 'org.matrix.custom.html';
    content['formatted_body'] = await matrixMarkdown.toSafeHtml(text);
  } else if (format !== 'plain') {
    throw new Error('Format must be markdown or plain.');
  }
  return content;
}

async function sendEvent({ auth, roomId, eventType, content, txnId }: { auth: MatrixAuthValue; roomId: string; eventType: string; content: Record<string, unknown>; txnId: string }): Promise<{ eventId: string; roomId: string; transactionId: string }> {
  const body = await matrixClient.request({
    auth,
    method: HttpMethod.PUT,
    path: matrixIds.clientPath('rooms', roomId, 'send', eventType, txnId),
    body: content,
  });
  const eventId = matrixClient.isRecord(body) ? body['event_id'] : undefined;
  if (typeof eventId !== 'string') {
    throw new Error('The homeserver did not return an event ID.');
  }
  return { eventId, roomId, transactionId: txnId };
}

async function roomName({ auth, roomId }: { auth: MatrixAuthValue; roomId: string }): Promise<string | null> {
  try {
    const body = await matrixClient.request({
      auth,
      method: HttpMethod.GET,
      path: matrixIds.clientPath('rooms', roomId, 'state', 'm.room.name', ''),
    });
    return matrixClient.isRecord(body) ? matrixClient.stringOr(body['name']) : null;
  } catch (error) {
    if (error instanceof MatrixApiError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }
}

async function joinedRoomIds({ auth }: { auth: MatrixAuthValue }): Promise<string[]> {
  const body = await matrixClient.request({ auth, method: HttpMethod.GET, path: matrixIds.clientPath('joined_rooms') });
  const rooms = matrixClient.isRecord(body) ? matrixClient.arrayOf(body['joined_rooms']) : [];
  return rooms.filter((room): room is string => typeof room === 'string');
}

async function mapLimited<T, R>({ items, limit, fn }: { items: T[]; limit: number; fn: (item: T) => Promise<R> }): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function mapEvent({ raw, roomId }: { raw: unknown; roomId: string | null }): MatrixEventSummary {
  const event = matrixClient.isRecord(raw) ? raw : {};
  const content = matrixClient.isRecord(event['content']) ? event['content'] : {};
  const relates = matrixClient.isRecord(content['m.relates_to']) ? content['m.relates_to'] : {};
  const inReply = matrixClient.isRecord(relates['m.in_reply_to']) ? relates['m.in_reply_to'] : {};
  const unsigned = matrixClient.isRecord(event['unsigned']) ? event['unsigned'] : {};
  const ts = event['origin_server_ts'];
  return {
    eventId: matrixClient.stringOr(event['event_id']),
    roomId: matrixClient.stringOr(event['room_id']) ?? roomId,
    sender: matrixClient.stringOr(event['sender']),
    type: matrixClient.stringOr(event['type']),
    msgtype: matrixClient.stringOr(content['msgtype']),
    body: matrixClient.stringOr(content['body']),
    formattedBody: matrixClient.stringOr(content['formatted_body']),
    timestamp: typeof ts === 'number' ? new Date(ts).toISOString() : null,
    relType: matrixClient.stringOr(relates['rel_type']),
    relatesToEventId: matrixClient.stringOr(relates['event_id']),
    inReplyToEventId: matrixClient.stringOr(inReply['event_id']),
    stateKey: matrixClient.stringOr(event['state_key']),
    encrypted: event['type'] === 'm.room.encrypted',
    redacted: matrixClient.isRecord(unsigned['redacted_because']),
  };
}

export const matrixCommon = {
  resolveAlias,
  resolveRoom,
  buildTextContent,
  sendEvent,
  roomName,
  joinedRoomIds,
  mapLimited,
  mapEvent,
  MSG_TYPES,
};

export type MatrixEventSummary = {
  eventId: string | null;
  roomId: string | null;
  sender: string | null;
  type: string | null;
  msgtype: string | null;
  body: string | null;
  formattedBody: string | null;
  timestamp: string | null;
  relType: string | null;
  relatesToEventId: string | null;
  inReplyToEventId: string | null;
  stateKey: string | null;
  encrypted: boolean;
  redacted: boolean;
};
