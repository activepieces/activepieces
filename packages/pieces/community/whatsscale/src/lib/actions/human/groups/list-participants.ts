import { createAction, Property } from '@activepieces/pieces-framework';
import { listGroupParticipantsOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';

export const listParticipantsInGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_list_participants_in_group',
  classification: 'SEARCH',
  displayName: 'List Group Participants',
  description: 'List the members of a WhatsApp group selected from the dropdown, and their roles.',
  audience: 'human',
  aiMetadata: { description: 'Lists the members of a WhatsApp group chosen from the session group list, including each member phone number (best-effort) and role (participant, admin, or superadmin). Pick this when a human is building the step; use the by-ID variant for a raw group ID an agent already holds. Read-only and idempotent.', idempotent: true },
  outputSchema: listGroupParticipantsOutputSchema,
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
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
    const { session, group, limit, offset } = context.propsValue;

    const queryParams: Record<string, string> = { session };
    if (limit != null) queryParams['limit'] = String(limit);
    if (offset != null) queryParams['offset'] = String(offset);

    const response = await whatsscaleClient(
      auth,
      HttpMethod.GET,
      `/v1/groups/${encodeURIComponent(group)}/participants`,
      undefined,
      queryParams,
    );
    return response.body;
  },
});
