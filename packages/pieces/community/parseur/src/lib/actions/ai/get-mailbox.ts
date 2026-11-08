import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurRecord } from '../../common/types';
import { mailboxOutputSchema } from '../../output-schemas';

export const getMailboxAction = createAction({
  auth: parseurAuth,
  name: 'parseur_get_mailbox',
  outputSchema: mailboxOutputSchema,
  displayName: 'Get Mailbox',
  description: 'Gets one mailbox with its settings, fields and webhooks.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Parseur mailbox by ID: its settings, email_prefix (its address is "<email_prefix>@in.parseur.com"), its fields (parser_object_set), tables and webhooks. Read it before Update Mailbox to see the current fields.',
    idempotent: true,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurRecord>({
      auth,
      method: HttpMethod.GET,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}`,
    });
  },
});
