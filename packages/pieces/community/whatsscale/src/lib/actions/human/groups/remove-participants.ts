import { createAction } from '@activepieces/pieces-framework';
import { groupParticipantResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { toParticipantJids, ConductorParticipantResult, flattenParticipantResults } from '../../../common/group-participants';

export const removeParticipantsFromGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_remove_participants_from_group',
  classification: 'WRITE',
  displayName: 'Remove Participants from a Group',
  description: 'Remove members from a WhatsApp group, both selected from dropdowns.',
  audience: 'human',
  aiMetadata: { description: 'Removes one or more current members from a WhatsApp group, with both the group and the members chosen from dropdowns. Pick this when a human is building the step; use the by-ID variant to remove a raw phone number an agent already holds. Idempotent: removing someone already outside the group converges on the same end state.', idempotent: true },
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
      `/v1/groups/${group}/participants/remove`,
      { session, participants: toParticipantJids(participants) },
    );
    return flattenParticipantResults(response.body as ConductorParticipantResult[]);
  },
});
