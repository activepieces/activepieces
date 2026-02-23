export interface ParsedWebhook {
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  contacts: Array<Record<string, unknown>>;
  messages: Array<Record<string, unknown>>;
  statuses: Array<Record<string, unknown>>;
}

export function parseWebhookPayload(payload: unknown): ParsedWebhook {
  const result: ParsedWebhook = {
    contacts: [],
    messages: [],
    statuses: [],
  };

  if (!payload || typeof payload !== 'object') {
    return result;
  }

  const body = payload as Record<string, unknown>;
  const entry = body['entry'] as Array<Record<string, unknown>> | undefined;

  if (!Array.isArray(entry)) {
    return result;
  }

  for (const e of entry) {
    const changes = e['changes'] as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = change['value'] as Record<string, unknown> | undefined;
      if (!value) continue;

      const metadata = value['metadata'] as Record<string, string> | undefined;
      if (metadata) {
        result.phoneNumberId = metadata['phone_number_id'];
        result.displayPhoneNumber = metadata['display_phone_number'];
      }

      const contacts = value['contacts'] as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(contacts)) {
        result.contacts.push(...contacts);
      }

      const messages = value['messages'] as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(messages)) {
        result.messages.push(...messages);
      }

      const statuses = value['statuses'] as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(statuses)) {
        result.statuses.push(...statuses);
      }
    }
  }

  return result;
}
