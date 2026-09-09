import { createAction } from '@activepieces/pieces-framework';
import { listWhatsappGroupsOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';

type ConductorGroupParticipant = {
  IsAdmin?: boolean;
};

type ConductorGroup = {
  id: string;
  name?: string;
  subject?: string;
  size: number;
  participants?: ConductorGroupParticipant[];
};

export const listWhatsappGroupsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_list_whatsapp_groups',
  classification: 'SEARCH',
  displayName: 'List WhatsApp Groups',
  description: 'List the WhatsApp groups a session belongs to.',
  audience: 'both',
  aiMetadata: { description: 'Lists the WhatsApp groups the session is a member of, including each group\'s chat ID, name, member count, and admin count. Use to discover a group ID before sending a message or managing group membership; use List Group Participants for the full member list of one group. Read-only and idempotent.', idempotent: true },
  outputSchema: listWhatsappGroupsOutputSchema,
  props: {
    session: whatsscaleProps.session,
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session } = context.propsValue;

    const response = await whatsscaleClient(auth, HttpMethod.GET, `/api/${session}/groups`);
    const groups = response.body as ConductorGroup[];

    return groups.map((group) => ({
      group_id: group.id,
      name: group.name ?? group.subject ?? null,
      size: group.size,
      admin_count: group.participants?.filter((p) => p.IsAdmin).length ?? null,
    }));
  },
});
