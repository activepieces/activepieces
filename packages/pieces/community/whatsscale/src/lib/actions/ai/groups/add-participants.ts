import { createAction, Property } from '@activepieces/pieces-framework';
import { groupParticipantResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { toParticipantJids, ConductorParticipantResult, flattenParticipantResults } from '../../../common/group-participants';

export const addGroupParticipantsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_add_group_participants_by_id',
  classification: 'WRITE',
  displayName: 'Add Participants to a Group (By ID)',
  description: 'Add one or more people to a WhatsApp group by group ID.',
  audience: 'ai',
  aiMetadata: { description: 'Adds one or more phone numbers to a WhatsApp group as members, given the raw group ID. Not idempotent: a number already in the group may error or no-op depending on how the group responds, so check List Group Participants first if you need to avoid duplicates.', idempotent: false },
  outputSchema: groupParticipantResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The group ID, with or without the @g.us suffix.',
      required: true,
    }),
    participants: Property.Array({
      displayName: 'Participants',
      description: 'Phone numbers with country code (e.g. +31612345678).',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, groupId, participants } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      `/v1/groups/${groupId}/participants/add`,
      { session, participants: toParticipantJids(participants) },
    );
    return flattenParticipantResults(response.body as ConductorParticipantResult[]);
  },
});
