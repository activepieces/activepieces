import {
  TinkoContact,
  TinkoNote,
  TinkoSendMessageResult,
  TinkoTag,
  tinkoClient,
} from './client';

function contact(input: TinkoContact): Record<string, unknown> {
  const tags = input.tags ?? [];
  const customFields = tinkoClient.isRecord(input.customfields) ? input.customfields : {};
  return {
    id: input.id,
    phone: input.phone,
    name: input.name ?? null,
    type: input.type ?? null,
    blocked: input.blocked ?? false,
    avatar: input.avatar ?? null,
    tags: tags.map((tag) => tag.name).join(', '),
    tag_ids: tags.map((tag) => tag.id).join(', '),
    ...Object.fromEntries(
      Object.entries(customFields).map(([key, value]) => [
        `custom_field_${key}`,
        primitive(value),
      ])
    ),
    created_at: input.created_at ?? null,
    updated_at: input.updated_at ?? null,
  };
}

function sentMessage(input: TinkoSendMessageResult): Record<string, unknown> {
  return {
    message_id: input.message?.id ?? null,
    message_content: input.message?.content ?? null,
    message_type: input.message?.type ?? null,
    message_direction: input.message?.direction ?? null,
    message_visibility: input.message?.visibility ?? null,
    message_created_at: input.message?.created_at ?? null,
    chat_id: input.chat?.id ?? null,
    chat_status: input.chat?.status ?? null,
    chat_is_open: input.chat?.is_open ?? null,
    contact_phone: input.contact?.phone ?? null,
    contact_name: input.contact?.name ?? null,
  };
}

function tag(input: TinkoTag): Record<string, unknown> {
  return {
    id: input.id,
    name: input.text,
    emoji: input.emoji ?? null,
    color: input.color ?? null,
    created_at: input.created_at ?? null,
  };
}

function note(input: TinkoNote): Record<string, unknown> {
  return {
    id: input.id,
    content: input.content,
    user_id: input.user?.id ?? null,
    user_name: input.user?.name ?? null,
    created_at: input.created_at ?? null,
  };
}

function primitive(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return JSON.stringify(value);
}

export const tinkoOutput = {
  contact,
  sentMessage,
  tag,
  note,
  primitive,
};
