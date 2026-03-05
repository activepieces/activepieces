import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';

export const getChannelInfoAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_get_channel_info',
  displayName: 'Get Channel Info',
  description: 'Retrieve metadata for a WhatsApp Channel by its ID',
  props: {
    session: whatsscaleProps.session,
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'Channel ID, with or without @newsletter suffix. Tip: copy from Watch Channel Messages trigger output.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const channelId = encodeURIComponent(context.propsValue.channel_id.trim());

    const response = await whatsscaleClient(
      auth,
      HttpMethod.GET,
      `/make/channels/${channelId}/info`,
      undefined,
      { session: context.propsValue.session }
    );

    return response.body;
  },
});
