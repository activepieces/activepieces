import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurNotificationResponse } from '../../common/types';
import { notificationOutputSchema } from '../../output-schemas';

export const copyDocumentAction = createAction({
  auth: parseurAuth,
  name: 'parseur_copy_document',
  outputSchema: notificationOutputSchema,
  displayName: 'Copy Document',
  description: 'Copies a document into another mailbox.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a Parseur document into another mailbox, where it is parsed again with that mailbox\'s fields and uses credits. Asynchronous and returns no new ID: find the copy with List Documents on the target mailbox. Every call makes another copy.',
    idempotent: false,
  },
  props: {
    documentId: parseurAiProps.documentId({ required: true }),
    targetMailboxId: parseurAiProps.targetMailboxId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurNotificationResponse>({
      auth,
      method: HttpMethod.POST,
      path: `/document/${encodeURIComponent(propsValue.documentId)}/copy/${encodeURIComponent(propsValue.targetMailboxId)}`,
    });
  },
});
