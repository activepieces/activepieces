import { createAction } from '@activepieces/pieces-framework';
import { groupParticipantResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { toParticipantJids, ConductorParticipantResult, flattenParticipantResults } from '../../../common/group-participants';

export const demoteAdminsInGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_demote_admins_in_group',
  classification: 'WRITE',
  displayName: 'Demote Group Admins',
  description: 'Revoke admin rights from members of a WhatsApp group, both selected from dropdowns.',
  audience: 'human',
  aiMetadata: { description: 'Revokes admin privileges from one or more members of a WhatsApp group, dropping them back to regular member, with both the group and the members chosen from dropdowns. Pick this when a human is building the step; use the by-ID variant for a raw phone number an agent already holds. Idempotent: demoting a non-admin converges on the same end state.', idempotent: true },
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
      `/v1/groups/${group}/admin/demote`,
      { session, participants: toParticipantJids(participants) },
    );
    return flattenParticipantResults(response.body as ConductorParticipantResult[]);
  },
});
