import { createAction } from '@activepieces/pieces-framework';
import { groupParticipantResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { toParticipantJids, ConductorParticipantResult, flattenParticipantResults } from '../../../common/group-participants';

export const promoteAdminsInGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_promote_admins_in_group',
  classification: 'WRITE',
  displayName: 'Promote Group Admins',
  description: 'Grant admin rights to members of a WhatsApp group, both selected from dropdowns.',
  audience: 'human',
  aiMetadata: { description: 'Grants admin privileges to one or more current members of a WhatsApp group, with both the group and the members chosen from dropdowns. Pick this when a human is building the step; use the by-ID variant for a raw phone number an agent already holds. Idempotent: promoting an existing admin converges on the same end state.', idempotent: true },
  outputSchema: groupParticipantResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
    participants: whatsscaleProps.groupParticipants,
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, group, participants } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      `/v1/groups/${encodeURIComponent(group)}/admin/promote`,
      { session, participants: toParticipantJids(participants) },
    );
    return flattenParticipantResults(response.body as ConductorParticipantResult[]);
  },
});
