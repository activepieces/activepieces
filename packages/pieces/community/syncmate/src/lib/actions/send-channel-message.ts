import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { syncmateAuth } from '../auth';
import { syncmateRequest } from '../common/client';
import { assertSendable, channelJid, RecipientType, singleBody, standardMessage } from '../common/payload';
import { syncmateProps } from '../common/props';

export const sendChannelMessageAction = createAction({
  auth: syncmateAuth,
  name: 'channelSend',
  displayName: 'Send Message to Channel',
  description: 'Post a text update to a WhatsApp channel (newsletter) your QR-connected number administers.',
  props: {
    channel: syncmateProps.channel,
    number: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'Used when no channel is picked above. Format 1203630xxxxxxxx@newsletter; the @newsletter part is added if missing.',
      required: false,
    }),
    message: syncmateProps.message(true),
  },
  async run({ auth, propsValue }) {
    const message = standardMessage({
      number: channelJid(propsValue.channel || propsValue.number),
      message: propsValue.message,
      type: RecipientType.CHANNEL,
    });
    assertSendable(message, 'channel (pick one or enter its Channel ID)');

    return syncmateRequest({ auth, method: HttpMethod.POST, path: '/v1/message', body: singleBody(message) });
  },
});
