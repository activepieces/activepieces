import { createAction } from '@activepieces/pieces-framework';
import { listSessionsOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';

type ConductorSession = {
  name: string;
  status: string;
  presence?: string;
  me?: {
    id?: string;
    pushName?: string;
    jid?: string;
  };
};

export const listSessionsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_list_sessions',
  classification: 'SEARCH',
  displayName: 'List WhatsApp Sessions',
  description: 'List every WhatsApp session (device) connected to this account, and its status.',
  audience: 'both',
  aiMetadata: { description: 'Lists every WhatsApp session on the account with its connection status and linked phone. Use to discover a session name to pass into other actions when you don\'t already have one; a "WORKING" status means the session is connected and ready to send. Read-only and idempotent.', idempotent: true },
  outputSchema: listSessionsOutputSchema,
  props: {},
  async run(context) {
    const auth = context.auth.secret_text;

    const response = await whatsscaleClient(auth, HttpMethod.GET, '/api/sessions');
    const sessions = response.body as ConductorSession[];

    return sessions.map((session) => ({
      session_name: session.name,
      status: session.status,
      presence: session.presence ?? null,
      phone_number: session.me?.id?.replace('@c.us', '') ?? null,
      push_name: session.me?.pushName ?? null,
      jid: session.me?.jid ?? null,
    }));
  },
});
