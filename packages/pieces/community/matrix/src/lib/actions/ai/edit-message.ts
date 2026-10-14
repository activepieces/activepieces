import { createAction, Property } from '@activepieces/pieces-framework';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
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
      'Edits a message previously sent by this account by posting an m.replace edit event; clients then show the new text with an "(edited)" marker. Needs roomId (!...) and eventId ($...) of the original message. Only the original sender can edit. The original text stays in the room history. Each call adds a new edit event unless transactionId repeats.',
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
  async run({ auth, propsValue }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const eventId = matrixIds.eventId(propsValue.eventId);
    const text = matrixClient.requiredText({ value: propsValue.text, label: 'New Text' });
    const txnId = matrixIds.transactionId(propsValue.transactionId);
    const newContent = await matrixCommon.buildTextContent({ text, msgtype: 'm.text', format: propsValue.format ?? 'markdown' });
    const content: Record<string, unknown> = {
      ...newContent,
      body: `* ${text}`,
      'm.new_content': newContent,
      'm.relates_to': { rel_type: 'm.replace', event_id: eventId },
    };
    if (typeof newContent['formatted_body'] === 'string') content['formatted_body'] = `* ${newContent['formatted_body']}`;
    const sent = await matrixCommon.sendEvent({ auth: auth.props, roomId, eventType: 'm.room.message', content, txnId });
    return { ...sent, editedEventId: eventId };
  },
});
