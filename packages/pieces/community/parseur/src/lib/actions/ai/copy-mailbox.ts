import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurNotificationResponse } from '../../common/types';
import { notificationOutputSchema } from '../../output-schemas';

export const copyMailboxAction = createAction({
  auth: parseurAuth,
  name: 'parseur_copy_mailbox',
  outputSchema: notificationOutputSchema,
  displayName: 'Copy Mailbox',
  description: 'Makes a copy of a mailbox with its fields and templates.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a Parseur mailbox with its settings, fields and templates (not its documents) into a new mailbox. Asynchronous and returns no new ID: find the copy with List Mailboxes. Every call makes another copy.',
    idempotent: false,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurNotificationResponse>({
      auth,
      method: HttpMethod.POST,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}/copy`,
    });
  },
});
