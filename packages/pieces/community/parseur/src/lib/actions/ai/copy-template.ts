import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurNotificationResponse } from '../../common/types';
import { notificationOutputSchema } from '../../output-schemas';

export const copyTemplateAction = createAction({
  auth: parseurAuth,
  name: 'parseur_copy_template',
  outputSchema: notificationOutputSchema,
  displayName: 'Copy Template',
  description: 'Copies a template into another mailbox.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a Parseur template into another mailbox (or the same one). Asynchronous and returns no new ID: find the copy with List Templates on the target mailbox. Every call makes another copy.',
    idempotent: false,
  },
  props: {
    templateId: parseurAiProps.templateId({ required: true }),
    targetMailboxId: parseurAiProps.targetMailboxId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurNotificationResponse>({
      auth,
      method: HttpMethod.POST,
      path: `/template/${encodeURIComponent(propsValue.templateId)}/copy/${encodeURIComponent(propsValue.targetMailboxId)}`,
    });
  },
});
