import {
  ApFile,
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { AuthenticationParams } from '../common/types';
import { chatDropdown } from '../common/properties';

export const sendMessageToExistingChat = createAction({
  auth: timelinesAiAuth,
  name: 'sendMessageToExistingChat',
  classification: 'WRITE',
  displayName: 'Send Message to Existing Chat',
  description: 'Sends a text message to an existing chat.',
  audience: 'both',
  aiMetadata: { description: 'Sends a text message into an existing TimelinesAI WhatsApp chat identified by its numeric chat_id, optionally attaching an uploaded file and a label. Use to reply within a conversation you already have the chat_id for; use Send Message to New Chat instead when starting a conversation by phone or JID. Not idempotent: each call posts a new message.', idempotent: false },
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Send to',
      icon: 'send',
      props: ['chat_id'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['text', 'file', 'attachment_template_id'],
    },
  ],
  props: {
    chat_id: chatDropdown({
      description: 'The chat to send the message to.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'WhatsApp formatting like *bold* works.',
      placeholder: 'Hi! Your order has shipped.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'Optional file to send with the message.',
      required: false,
    }),
    label: Property.ShortText({
      displayName: 'Label',
      description: 'Label to add to the chat.',
      placeholder: 'VIP',
      required: false,
      advanced: true,
    }),
    attachment_template_id: Property.Number({
      displayName: 'Attachment Template ID',
      description: 'ID of an attachment template to send with the message.',
      required: false,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    const { chat_id, file, text, label, attachment_template_id } = propsValue;
    if (chat_id === undefined) {
      throw new Error('chat_id is required');
    }
    const fileUid = await uploadIfPresent({ apiKey, file });

    const response = await timelinesAiCommon.sendMessageToExistingChat({
      apiKey,
      chat_id: Number(chat_id),
      text,
      label,
      ...(typeof attachment_template_id === 'number'
        ? { attachment_template_id }
        : {}),
      file_uid: fileUid,
    });

    if (response.status !== 'ok') {
      throw new Error(response.message || 'Failed to send message');
    }

    return response.data;
  },
});

async function uploadIfPresent({
  apiKey,
  file,
}: {
  apiKey: AuthenticationParams['apiKey'];
  file: ApFile | undefined | null;
}): Promise<string | undefined> {
  if (!file) {
    return undefined;
  }
  const fileUploadResponse = await timelinesAiCommon.uploadFile({
    apiKey,
    file: file.data,
    filename: file.filename,
  });
  if (fileUploadResponse.status !== 'ok') {
    throw new Error('File upload failed');
  }
  return fileUploadResponse.data.uid;
}
