import { createAction, Property } from '@activepieces/pieces-framework';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixCommon } from '../../common/common';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const sendTextMessage = createAction({
  auth: matrixAuth,
  name: 'send_text_message',
  classification: 'WRITE',
  displayName: 'Send Text Message',
  description: 'Send a text, notice or emote message to a room, optionally as a reply.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a message to a Matrix room the account has joined. room accepts a room ID (!abc:server) or an alias (#room:server). format markdown (default) also sends sanitized HTML; plain sends text only. msgtype m.text (default), m.notice (bot-style) or m.emote (/me). Set replyToEventId to send it as a reply to that event. Each call posts a new message. If a send fails (for example a timeout after the server stored it), the automatic retry of that same send reuses its transaction ID, so the server returns the original eventId instead of posting twice. Passing a transactionId that repeats a previous call from the same connection also returns the original eventId. Text sent into an end-to-end encrypted room is delivered unencrypted.',
    idempotent: false,
  },
  outputSchema: matrixOutputSchemas.sent,
  props: {
    room: Property.ShortText({ displayName: 'Room', description: 'Room ID (!abc:server) or alias (#room:server).', required: true }),
    text: Property.LongText({ displayName: 'Text', required: true }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'markdown',
      options: { options: [{ label: 'Markdown', value: 'markdown' }, { label: 'Plain text', value: 'plain' }] },
    }),
    msgtype: Property.StaticDropdown({
      displayName: 'Message Type',
      required: false,
      defaultValue: 'm.text',
      options: { options: [{ label: 'Text', value: 'm.text' }, { label: 'Notice', value: 'm.notice' }, { label: 'Emote', value: 'm.emote' }] },
    }),
    replyToEventId: Property.ShortText({ displayName: 'Reply To Event ID', description: 'Event ID ($...) to reply to.', required: false }),
    transactionId: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'Optional. Reuse the same value to retry a send without posting twice.',
      required: false,
    }),
  },
  async run({ auth, propsValue, run, step }) {
    const text = matrixClient.messageText({ value: propsValue.text, label: 'Text' });
    const replyText = matrixClient.optionalText(propsValue.replyToEventId);
    const replyTo = replyText === undefined ? undefined : matrixIds.eventId(replyText);
    const content = await matrixCommon.buildTextContent({
      text,
      msgtype: propsValue.msgtype ?? 'm.text',
      format: propsValue.format ?? 'markdown',
    });
    if (replyTo) content['m.relates_to'] = { 'm.in_reply_to': { event_id: replyTo } };
    const roomId = await matrixCommon.resolveRoom({ auth: auth.props, room: propsValue.room });
    return matrixIds.withTransactionId({
      value: propsValue.transactionId,
      run,
      step,
      parts: [roomId, content],
      send: (txnId) => matrixCommon.sendEvent({ auth: auth.props, roomId, eventType: 'm.room.message', content, txnId }),
    });
  },
});
