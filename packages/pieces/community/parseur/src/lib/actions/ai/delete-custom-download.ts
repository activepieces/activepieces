import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import { deleteCustomDownloadOutputSchema } from '../../output-schemas';

export const deleteCustomDownloadAction = createAction({
  auth: parseurAuth,
  name: 'parseur_delete_custom_download',
  outputSchema: deleteCustomDownloadOutputSchema,
  displayName: 'Delete Custom Download',
  description: 'Permanently deletes a custom download.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a custom download from a Parseur mailbox; its links stop working. The parsed data itself is kept. Get both IDs from List Custom Downloads.',
    idempotent: false,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
    customDownloadId: parseurAiProps.customDownloadId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await parseurClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}/export_config/${encodeURIComponent(propsValue.customDownloadId)}`,
    });
    return {
      deleted: true,
      mailboxId: propsValue.mailboxId,
      customDownloadId: propsValue.customDownloadId,
    };
  },
});
