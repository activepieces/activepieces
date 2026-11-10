import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const redactMessage = createAction({
  auth: matrixAuth,
  name: 'redact_message',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete (Redact) Message',
  description: 'Redact a message or reaction, removing its content for everyone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Redacts (deletes) an event in a room: its content is stripped for every member and cannot be restored. Works on messages, edits and reactions. Needs roomId (!...) and eventId ($...); other users\' events need moderator power level. Redacting an already redacted event succeeds and changes nothing.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.redaction,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
    eventId: Property.ShortText({ displayName: 'Event ID', required: true }),
    reason: Property.ShortText({ displayName: 'Reason', required: false }),
    transactionId: Property.ShortText({ displayName: 'Transaction ID', required: false }),
  },
  async run({ auth, propsValue, run, step }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const eventId = matrixIds.eventId(propsValue.eventId);
    const reason = matrixClient.optionalText(propsValue.reason);
    return matrixIds.withTransactionId({
      value: propsValue.transactionId,
      run,
      step,
      parts: [roomId, eventId, reason ?? null],
      send: async (txnId) => {
        const body = await matrixClient.request({
          auth: auth.props,
          method: HttpMethod.PUT,
          path: matrixIds.clientPath('rooms', roomId, 'redact', eventId, txnId),
          body: reason === undefined ? {} : { reason },
        });
        return {
          redactionEventId: matrixClient.isRecord(body) ? matrixClient.stringOr(body['event_id']) : null,
          roomId,
          redactedEventId: eventId,
          transactionId: txnId,
        };
      },
    });
  },
});
