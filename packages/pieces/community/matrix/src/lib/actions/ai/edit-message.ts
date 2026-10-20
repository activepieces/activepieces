import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { matrixAuth } from '../../auth';
import { matrixClient, MatrixAuthValue } from '../../common/client';
import { matrixCommon } from '../../common/common';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const editMessage = createAction({
  auth: matrixAuth,
  name: 'edit_message',
  classification: 'WRITE',
  displayName: 'Edit Message',
  description: 'Replace the text of a message this account sent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a message previously sent by this account by posting an m.replace edit event; clients then show the new text with an "(edited)" marker. Needs roomId (!...) and eventId ($...) of the original message. Only the original sender can edit, and only text, notice and emote messages; the edit keeps the original message type. The original text stays in the room history. Each call adds a new edit event; a retry after a failed call, or a repeated transactionId, returns the original edit event instead of adding another.',
    idempotent: false,
  },
  outputSchema: matrixOutputSchemas.edited,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
    eventId: Property.ShortText({ displayName: 'Event ID', description: 'The message to edit ($...).', required: true }),
    text: Property.LongText({ displayName: 'New Text', required: true }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'markdown',
      options: { options: [{ label: 'Markdown', value: 'markdown' }, { label: 'Plain text', value: 'plain' }] },
    }),
    transactionId: Property.ShortText({ displayName: 'Transaction ID', required: false }),
  },
  async run({ auth, propsValue, run, step }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const eventId = matrixIds.eventId(propsValue.eventId);
    const text = matrixClient.messageText({ value: propsValue.text, label: 'New Text' });
    const msgtype = await assertEditable({ auth: auth.props, roomId, eventId });
    const newContent = await matrixCommon.buildTextContent({ text, msgtype, format: propsValue.format ?? 'markdown' });
    const content: Record<string, unknown> = {
      ...newContent,
      body: `* ${text}`,
      'm.new_content': newContent,
      'm.relates_to': { rel_type: 'm.replace', event_id: eventId },
    };
    if (typeof newContent['formatted_body'] === 'string') content['formatted_body'] = `* ${newContent['formatted_body']}`;
    const sent = await matrixIds.withTransactionId({
      value: propsValue.transactionId,
      run,
      step,
      parts: [roomId, content],
      send: (txnId) => matrixCommon.sendEvent({ auth: auth.props, roomId, eventType: 'm.room.message', content, txnId }),
    });
    return { ...sent, editedEventId: eventId };
  },
});

async function assertEditable({ auth, roomId, eventId }: { auth: MatrixAuthValue; roomId: string; eventId: string }): Promise<string> {
  const [original, me] = await Promise.all([
    matrixClient.request({ auth, method: HttpMethod.GET, path: matrixIds.clientPath('rooms', roomId, 'event', eventId) }),
    matrixClient.request({ auth, method: HttpMethod.GET, path: matrixIds.clientPath('account', 'whoami') }),
  ]);
  const event = matrixCommon.mapEvent({ raw: original, roomId });
  const userId = matrixClient.isRecord(me) ? matrixClient.stringOr(me['user_id']) : null;
  if (userId === null) throw new Error('The homeserver did not return the connected user ID.');
  if (event.sender !== userId) {
    throw new Error(`Only the original sender can edit a message. ${eventId} was sent by ${event.sender ?? 'an unknown user'}, not ${userId}.`);
  }
  if (event.redacted) throw new Error(`Message ${eventId} was deleted and cannot be edited.`);
  if (event.type !== 'm.room.message') throw new Error(`Event ${eventId} is not a message (type ${event.type ?? 'unknown'}).`);
  if (event.relType === 'm.replace') {
    throw new Error(`Event ${eventId} is itself an edit. Edit the original message ${event.relatesToEventId ?? ''} instead.`.trim());
  }
  const msgtype = event.msgtype ?? 'm.text';
  if (!matrixCommon.MSG_TYPES.includes(msgtype)) {
    throw new Error(`Message ${eventId} is a ${msgtype} message; only text, notice and emote messages can be edited.`);
  }
  return msgtype;
}
