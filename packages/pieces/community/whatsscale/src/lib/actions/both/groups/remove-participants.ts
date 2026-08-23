import { createAction, Property } from '@activepieces/pieces-framework';
import { groupParticipantResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { toParticipantJids, ConductorParticipantResult, flattenParticipantResults } from '../../../common/group-participants';

export const removeGroupParticipantsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_remove_group_participants',
  classification: 'WRITE',
  displayName: 'Remove Participants from a Group',
  description: 'Remove (kick) one or more people from a WhatsApp group by group ID.',
  audience: 'both',
  aiMetadata: { description: 'Removes one or more phone numbers from a WhatsApp group, given the raw group ID. Accepts a comma-separated list of phone numbers with country code. Idempotent: removing someone already outside the group converges on the same end state.', idempotent: true },
  outputSchema: groupParticipantResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The group ID, with or without the @g.us suffix.',
      required: true,
    }),
    participants: Property.ShortText({
      displayName: 'Participants',
      description: 'Comma-separated phone numbers with country code (e.g. +31612345678, +31687654321).',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, groupId, participants } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      `/v1/groups/${groupId}/participants/remove`,
      { session, participants: toParticipantJids(participants) },
    );
    return flattenParticipantResults(response.body as ConductorParticipantResult[]);
  },
});
