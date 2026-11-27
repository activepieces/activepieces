import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getInviteAction = createAction({
  auth: boxAuth,
  name: 'box_get_invite',
  displayName: 'Get Invite',
  description: 'Gets the status of a Box enterprise invite.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns an enterprise invite with its status, invited user and dates. Get the ID from Invite User.',
    idempotent: true,
  },
  props: {
    inviteId: Property.ShortText({
      displayName: 'Invite ID',
      description: 'ID of the invite. Get it from Invite User.',
      required: true,
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/invites/${encodeURIComponent(propsValue.inviteId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
