import { Property } from '@activepieces/pieces-framework';

function recipient() {
  return Property.ShortText({
    displayName: 'Recipient',
    description:
      'Phone number with country code and area code, for example 5511999999999. You can also use the ID of an existing Tinko contact or a WhatsApp group ID. An unknown phone number creates a new contact.',
    required: true,
  });
}

function body({
  channel,
  recipient,
  attendant,
  fields,
}: {
  channel: string;
  recipient: string;
  attendant: string | undefined;
  fields: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    phone: recipient.trim(),
    channel,
    ...(attendant ? { attendant } : {}),
    ...Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ),
  };
}

export const messageProps = {
  recipient,
  body,
};
