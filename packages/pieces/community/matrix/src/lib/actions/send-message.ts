import { createAction, Property } from '@activepieces/pieces-framework';
import { matrixAuth } from '../auth';
import { matrixClient } from '../common/client';
import { matrixCommon } from '../common/common';
import { matrixIds } from '../common/ids';
import { matrixOutputSchemas } from '../common/output-schemas';

const MAX_DROPDOWN_ROOMS = 200;

const roomDropdown = Property.Dropdown({
  auth: matrixAuth,
  displayName: 'Room',
  description: 'Pick one of the rooms this account has joined, or fill Room Alias instead.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect your Matrix account first', options: [] };
    }
    try {
      const rooms = await matrixCommon.joinedRoomIds({ auth: auth.props });
      const shown = rooms.slice(0, MAX_DROPDOWN_ROOMS);
      const options = await matrixCommon.mapLimited({
        items: shown,
        limit: 5,
        fn: async (roomId) => ({ label: (await matrixCommon.roomName({ auth: auth.props, roomId })) ?? roomId, value: roomId }),
      });
      options.sort((a, b) => a.label.localeCompare(b.label));
      return {
        disabled: false,
        options,
        placeholder:
          rooms.length > shown.length ? `Showing ${shown.length} of ${rooms.length} rooms; use Room Alias for others` : undefined,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: error instanceof Error ? `Could not load rooms: ${error.message}` : 'Could not load rooms',
        options: [],
      };
    }
  },
});

export const sendMessage = createAction({
  auth: matrixAuth,
  name: 'send_message',
  classification: 'WRITE',
  displayName: 'Send Message',
  description: 'Send a message to a room',
  audience: 'human',
  outputSchema: matrixOutputSchemas.sent,
  props: {
    room: roomDropdown,
    room_alias: Property.ShortText({
      displayName: 'Room Alias',
      description:
        'Used when no Room is picked, e.g. #room:example.org',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to send (markdown)',
      required: true,
    }),
  },
  async run({ auth, propsValue, run, step }) {
    const message = matrixClient.messageText({ value: propsValue.message, label: 'Message' });
    const picked = matrixClient.optionalText(propsValue.room);
    const alias = matrixClient.optionalText(propsValue.room_alias);
    if (picked === undefined && alias === undefined) {
      throw new Error('Pick a Room or fill Room Alias.');
    }
    const roomId =
      picked !== undefined
        ? matrixIds.roomId(picked)
        : (await matrixCommon.resolveAlias({ auth: auth.props, alias: matrixIds.roomAlias(alias) })).roomId;
    const content = await matrixCommon.buildTextContent({ text: message, msgtype: 'm.text', format: 'markdown' });
    return matrixIds.withTransactionId({
      value: undefined,
      run,
      step,
      parts: [roomId, content],
      send: (txnId) => matrixCommon.sendEvent({ auth: auth.props, roomId, eventType: 'm.room.message', content, txnId }),
    });
  },
});
