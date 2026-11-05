import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurRecord } from '../../common/types';
import { mailboxSchemaOutputSchema } from '../../output-schemas';

export const getMailboxSchemaAction = createAction({
  auth: parseurAuth,
  name: 'parseur_get_mailbox_schema',
  outputSchema: mailboxSchemaOutputSchema,
  displayName: 'Get Mailbox Schema',
  description: 'Gets the JSON schema of the data a mailbox extracts.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the JSON schema of the parsed data one Parseur mailbox produces: every field and table column with its type. Use it to know which keys a document\'s parsed result will have.',
    idempotent: true,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurRecord>({
      auth,
      method: HttpMethod.GET,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}/schema`,
    });
  },
});
