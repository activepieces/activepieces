import { SendMessageRequest } from './types';
import { sentValues } from './values';

function build({
  recipients,
  channels,
  messageType,
  content,
  sandbox,
}: MessageInput): SendMessageRequest {
  if (
    !Array.isArray(recipients) ||
    !recipients.length ||
    !recipients.every(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0
    )
  ) {
    throw new Error('Add at least one recipient phone number in E.164 format.');
  }
  if (
    channels !== undefined &&
    (!Array.isArray(channels) ||
      !channels.every(
        (value): value is string =>
          typeof value === 'string' &&
          ['sent', 'sms', 'whatsapp', 'rcs'].includes(value)
      ))
  ) {
    throw new Error('Choose valid Sent channels.');
  }
  if (!sentValues.isRecord(content))
    throw new Error('Enter the message content.');
  const payload: SendMessageRequest = {
    to: recipients.map((value) => value.trim()),
    ...(channels?.length ? { channel: channels } : {}),
    sandbox: sandbox ?? false,
  };
  if (messageType === 'text') {
    sentValues.requiredString({ value: content['text'], label: 'Text' });
    if (typeof content['text'] !== 'string')
      throw new Error('Text must be a string.');
    return { ...payload, text: content['text'] };
  }
  if (messageType !== 'template')
    throw new Error('Choose Text or Template for the message type.');
  return {
    ...payload,
    template: {
      id: sentValues.requiredString({
        value: content['template_id'],
        label: 'Template',
      }),
      parameters: sentValues.stringMap(content['parameters']),
    },
  };
}

export const sentMessage = { build };
export type MessageInput = {
  recipients: unknown;
  channels?: string[];
  messageType: string;
  content: unknown;
  sandbox?: boolean;
};
