import { createAction, Property } from '@activepieces/pieces-framework';
import { matrixAuth } from '../../auth';
import { MatrixApiError, matrixClient } from '../../common/client';
import { matrixCommon } from '../../common/common';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const reactToMessage = createAction({
  auth: matrixAuth,
  name: 'react_to_message',
  classification: 'WRITE',
  displayName: 'React to Message',
  description: 'Add an emoji reaction to a message.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a reaction (usually one emoji such as 👍) to an event in a room. Needs roomId (!...) and eventId ($...). If this account already reacted with the same key the call succeeds with alreadyReacted true and no new event. Remove a reaction with redact_message on the reaction event ID.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.reaction,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
    eventId: Property.ShortText({ displayName: 'Event ID', required: true }),
    key: Property.ShortText({ displayName: 'Reaction', description: 'Usually a single emoji, e.g. 👍', required: true }),
    transactionId: Property.ShortText({ displayName: 'Transaction ID', required: false }),
  },
  async run({ auth, propsValue, run, step }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const eventId = matrixIds.eventId(propsValue.eventId);
    const key = matrixClient.requiredText({ value: propsValue.key, label: 'Reaction' });
    return matrixIds.withTransactionId({
      value: propsValue.transactionId,
      run,
      step,
      parts: [roomId, eventId, key],
      send: async (txnId) => {
        try {
          const sent = await matrixCommon.sendEvent({
            auth: auth.props,
            roomId,
            eventType: 'm.reaction',
            content: { 'm.relates_to': { rel_type: 'm.annotation', event_id: eventId, key } },
            txnId,
          });
          return { eventId: sent.eventId, roomId, reactedToEventId: eventId, key, alreadyReacted: false, transactionId: txnId };
        } catch (error) {
          if (error instanceof MatrixApiError && error.errcode === 'M_DUPLICATE_ANNOTATION') {
            return { eventId: null, roomId, reactedToEventId: eventId, key, alreadyReacted: true, transactionId: txnId };
          }
          throw error;
        }
      },
    });
  },
});
