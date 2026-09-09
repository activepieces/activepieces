import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';

export const leaveSelectedGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_leave_selected_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Leave a Group',
  description: 'Make the connected session leave a WhatsApp group selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Removes the connected WhatsApp session from a group chosen from the session group list. The session can only rejoin if re-invited or re-added - treat as destructive. Pick this when a human is building the step; use the by-ID variant for a raw group ID an agent already holds. Idempotent: leaving a group you already left converges on the same end state.', idempotent: true },
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, group } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      `/v1/groups/${encodeURIComponent(group)}/leave`,
      { session },
    );
    return response.body;
  },
});
