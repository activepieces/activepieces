import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';

export const getGroupInfoAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_get_group_info',
  displayName: 'Get Group Info',
  description: 'Retrieve metadata for a WhatsApp group by its ID',
  props: {
    session: whatsscaleProps.session,
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description:
        'Group ID, with or without @g.us suffix. Tip: copy from Watch Group Messages trigger output or another action output.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const groupId = encodeURIComponent(context.propsValue.group_id.trim());

    const response = await whatsscaleClient(
      auth,
      HttpMethod.GET,
      `/make/groups/${groupId}/info`,
      undefined,
      { session: context.propsValue.session }
    );

    return response.body;
  },
});
