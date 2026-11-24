import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurNotificationResponse } from '../../common/types';
import { notificationOutputSchema } from '../../output-schemas';

export const deleteMailboxAction = createAction({
  auth: parseurAuth,
  name: 'parseur_delete_mailbox',
  outputSchema: notificationOutputSchema,
  displayName: 'Delete Mailbox',
  description: 'Permanently deletes a mailbox and all its documents.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Parseur mailbox with all its documents, templates and parsed data; it cannot be restored. Get the ID from List Mailboxes.',
    idempotent: false,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurNotificationResponse>({
      auth,
      method: HttpMethod.DELETE,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}`,
    });
  },
});
