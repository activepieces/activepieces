import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixCommon } from '../../common/common';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const getMessage = createAction({
  auth: matrixAuth,
  name: 'get_message',
  classification: 'READ',
  displayName: 'Get Message',
  description: 'Get one event (message) from a room by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one event by roomId (!...) and eventId ($...) and returns sender, type, body, formattedBody, timestamp and relation fields. Encrypted events come back with encrypted true and no body (this piece cannot decrypt). Read-only.',
    idempotent: true,
  },
  outputSchema: matrixOutputSchemas.event,
  props: {
    roomId: Property.ShortText({ displayName: 'Room ID', required: true }),
    eventId: Property.ShortText({ displayName: 'Event ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const roomId = matrixIds.roomId(propsValue.roomId);
    const eventId = matrixIds.eventId(propsValue.eventId);
    const body = await matrixClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: matrixIds.clientPath('rooms', roomId, 'event', eventId),
    });
    return matrixCommon.mapEvent({ raw: body, roomId });
  },
});
