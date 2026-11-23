import { tinkoClient } from './client';
import { tinkoOutput } from './output';

function message(envelope: TinkoEventEnvelope): Record<string, unknown> {
  const data = envelope.data;
  const messageData = record(data['message']);
  const file = record(messageData['file']);
  const users = list(data['users']);
  return {
    ...base(envelope),
    message_id: value(messageData, 'id'),
    message_content: value(messageData, 'content'),
    message_type: value(messageData, 'type'),
    message_direction: value(messageData, 'direction'),
    message_visibility: value(messageData, 'visibility'),
    message_reply_to: value(messageData, 'reply_to'),
    message_created_at: value(messageData, 'created_at'),
    file_url: value(file, 'url'),
    file_name: value(file, 'filename'),
    file_mimetype: value(file, 'mimetype'),
    file_size: value(file, 'size'),
    ...chat(record(data['chat'])),
    attendant_ids: users.map((user) => String(user['id'] ?? '')).join(', '),
    attendant_names: users.map((user) => String(user['name'] ?? '')).join(', '),
    ...contact(record(data['contact'])),
  };
}

function chatEvent(envelope: TinkoEventEnvelope): Record<string, unknown> {
  const data = envelope.data;
  return {
    ...base(envelope),
    ...chat(record(data['chat'])),
    ...contact(record(data['contact'])),
  };
}

function chatTransferred(envelope: TinkoEventEnvelope): Record<string, unknown> {
  const data = envelope.data;
  const chatData = record(data['chat']);
  const fromChannel = record(data['from_channel']);
  const toChannel = record(data['to_channel']);
  const toUser = record(data['to_user']);
  return {
    ...base(envelope),
    ...chat(chatData),
    chat_transferred_at: value(chatData, 'transferred_at'),
    from_channel_id: value(fromChannel, 'id'),
    from_channel_name: value(fromChannel, 'name'),
    from_channel_type: value(fromChannel, 'type'),
    to_channel_id: value(toChannel, 'id'),
    to_channel_name: value(toChannel, 'name'),
    to_channel_type: value(toChannel, 'type'),
    to_user_id: value(toUser, 'id'),
    to_user_name: value(toUser, 'name'),
    to_user_email: value(toUser, 'email'),
    ...contact(record(data['contact'])),
  };
}

function channelStatus(envelope: TinkoEventEnvelope): Record<string, unknown> {
  const channelData = record(envelope.data['channel']);
  return {
    ...base(envelope),
    channel_id: value(channelData, 'id'),
    channel_name: value(channelData, 'name'),
    channel_type: value(channelData, 'type'),
    channel_status: value(channelData, 'status'),
    channel_phone: value(channelData, 'phone'),
    connected: envelope.event === 'CHANNEL_CONNECTED',
    connected_at: value(channelData, 'connected_at'),
    disconnected_at: value(channelData, 'disconnected_at'),
    channel_created_at: value(channelData, 'created_at'),
    channel_updated_at: value(channelData, 'updated_at'),
  };
}

function channelIdOf(data: Record<string, unknown>): string | undefined {
  const candidates = [
    record(data['channel'])['id'],
    record(record(data['chat'])['channel'])['id'],
    record(data['from_channel'])['id'],
  ];
  return candidates.find((candidate): candidate is string => typeof candidate === 'string');
}

function parseEnvelope(body: unknown): TinkoEventEnvelope | null {
  if (!tinkoClient.isRecord(body) || typeof body['event'] !== 'string') {
    return null;
  }
  return {
    event: body['event'],
    data: record(body['data']),
    timestamp: typeof body['timestamp'] === 'string' ? body['timestamp'] : null,
    webhookId: typeof body['webhook_id'] === 'string' ? body['webhook_id'] : null,
  };
}

function base(envelope: TinkoEventEnvelope): Record<string, unknown> {
  return {
    event: envelope.event,
    event_timestamp: envelope.timestamp,
    delivery_id: envelope.webhookId,
  };
}

function chat(chatData: Record<string, unknown>): Record<string, unknown> {
  const channelData = record(chatData['channel']);
  return {
    chat_id: value(chatData, 'id'),
    chat_status: value(chatData, 'status'),
    chat_is_open: value(chatData, 'is_open'),
    chat_unread_count: value(chatData, 'unread_count'),
    chat_opened_at: value(chatData, 'opened_at'),
    chat_created_at: value(chatData, 'created_at'),
    chat_updated_at: value(chatData, 'updated_at'),
    channel_id: value(channelData, 'id'),
    channel_name: value(channelData, 'name'),
    channel_type: value(channelData, 'type'),
  };
}

function contact(contactData: Record<string, unknown>): Record<string, unknown> {
  const tags = list(contactData['tags']);
  const customFields = record(contactData['custom_fields']);
  return {
    contact_phone: value(contactData, 'phone'),
    contact_name: value(contactData, 'name'),
    contact_type: value(contactData, 'type'),
    contact_avatar: value(contactData, 'avatar'),
    contact_blocked: value(contactData, 'blocked'),
    contact_tags: tags.map((tag) => String(tag['name'] ?? '')).join(', '),
    contact_tag_ids: tags.map((tag) => String(tag['id'] ?? '')).join(', '),
    ...Object.fromEntries(
      Object.entries(customFields).map(([key, fieldValue]) => [
        `contact_custom_field_${key}`,
        tinkoOutput.primitive(fieldValue),
      ])
    ),
  };
}

function value(source: Record<string, unknown>, key: string): string | number | boolean | null {
  return tinkoOutput.primitive(source[key]);
}

function record(input: unknown): Record<string, unknown> {
  return tinkoClient.isRecord(input) ? input : {};
}

function list(input: unknown): Record<string, unknown>[] {
  return Array.isArray(input) ? input.filter(tinkoClient.isRecord) : [];
}

export const tinkoEvents = {
  message,
  chatEvent,
  chatTransferred,
  channelStatus,
  channelIdOf,
  parseEnvelope,
};

export type TinkoEventEnvelope = {
  event: string;
  data: Record<string, unknown>;
  timestamp: string | null;
  webhookId: string | null;
};
