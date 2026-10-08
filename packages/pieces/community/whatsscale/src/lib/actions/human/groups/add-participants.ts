import { createAction } from '@activepieces/pieces-framework';
import { groupParticipantResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { toParticipantJids, ConductorParticipantResult, flattenParticipantResults } from '../../../common/group-participants';

export const addParticipantsToGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_add_participants_to_group',
  classification: 'WRITE',
  displayName: 'Add Participants to a Group',
  description: 'Add contacts to a WhatsApp group, both selected from dropdowns.',
  audience: 'human',
  aiMetadata: { description: 'Adds one or more contacts to a WhatsApp group, with both the group and the contacts chosen from the session lists. Pick this when a human is building the step; use the by-ID variant to add a raw phone number an agent already holds. Not idempotent: a number already in the group may error or no-op depending on how the group responds.', idempotent: false },
  outputSchema: groupParticipantResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
    participants: whatsscaleProps.contactsToAdd,
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, group, participants } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      `/v1/groups/${encodeURIComponent(group)}/participants/add`,
      { session, participants: toParticipantJids(participants) },
    );
    return flattenParticipantResults(response.body as ConductorParticipantResult[]);
  },
});
