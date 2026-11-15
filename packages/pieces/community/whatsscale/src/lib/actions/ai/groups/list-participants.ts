import { createAction, Property } from '@activepieces/pieces-framework';
import { listGroupParticipantsOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';

export const listGroupParticipantsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_list_group_participants_by_id',
  classification: 'SEARCH',
  displayName: 'List Group Participants (By ID)',
  description: 'List the members of a WhatsApp group and their roles, by group ID.',
  audience: 'ai',
  aiMetadata: { description: 'Lists the members of a WhatsApp group by group ID, including each member\'s phone number (best-effort) and role (participant, admin, or superadmin). Use before Add/Remove/Promote/Demote Group Participants to confirm current membership. Read-only and idempotent.', idempotent: true },
  outputSchema: listGroupParticipantsOutputSchema,
  props: {
    session: whatsscaleProps.session,
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The group ID, with or without the @g.us suffix.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max participants to return. Default 100, max 500.',
      required: false,
      display: 'stepper',
      defaultValue: 100,
      min: 1,
      max: 500,
      step: 1,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of participants to skip. Default 0.',
      required: false,
      display: 'stepper',
      defaultValue: 0,
      min: 0,
      step: 1,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, groupId, limit, offset } = context.propsValue;

    const queryParams: Record<string, string> = { session };
    if (limit != null) queryParams['limit'] = String(limit);
    if (offset != null) queryParams['offset'] = String(offset);

    const response = await whatsscaleClient(
      auth,
      HttpMethod.GET,
      `/v1/groups/${encodeURIComponent(groupId)}/participants`,
      undefined,
      queryParams,
    );
    return response.body;
  },
});
