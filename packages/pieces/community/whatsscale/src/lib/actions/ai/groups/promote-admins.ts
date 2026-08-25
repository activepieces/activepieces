import { createAction, Property } from '@activepieces/pieces-framework';
import { groupParticipantResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { toParticipantJids, ConductorParticipantResult, flattenParticipantResults } from '../../../common/group-participants';

export const promoteGroupAdminsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_promote_group_admins_by_id',
  classification: 'WRITE',
  displayName: 'Promote Group Admins (By ID)',
  description: 'Grant admin rights to one or more group members by group ID.',
  audience: 'ai',
  aiMetadata: { description: 'Grants admin privileges to one or more existing members of a WhatsApp group, given the raw group ID; each must already be a member. Idempotent: promoting an existing admin converges on the same end state.', idempotent: true },
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
      `/v1/groups/${groupId}/admin/promote`,
      { session, participants: toParticipantJids(participants) },
    );
    return flattenParticipantResults(response.body as ConductorParticipantResult[]);
  },
});
