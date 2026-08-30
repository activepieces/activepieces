import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';

export const leaveGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_leave_group_by_id',
  classification: 'DESTRUCTIVE',
  displayName: 'Leave a Group (By ID)',
  description: 'Make the connected session leave a WhatsApp group by group ID.',
  audience: 'ai',
  aiMetadata: { description: 'Removes the connected WhatsApp session from a group, given the raw group ID. The session can only rejoin if re-invited or re-added — treat as destructive. Idempotent: leaving a group you already left converges on the same end state.', idempotent: true },
  props: {
    session: whatsscaleProps.session,
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The group ID, with or without the @g.us suffix.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, groupId } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      `/v1/groups/${encodeURIComponent(groupId)}/leave`,
      { session },
    );
    return response.body;
  },
});
