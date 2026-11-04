import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurClient } from '../common/client';
import { parseurProps } from '../common/props';
import type { ParseurReprocessDocumentResponse } from '../common/types';

export const reprocessDocumentAction = createAction({
  auth: parseurAuth,
  name: 'reprocessDocument',
  classification: 'WRITE',
  displayName: 'Reprocess Document',
  description:
    'Send an existing document back through parsing (e.g. after updating template).',
  audience: 'both',
  aiMetadata: {
    description:
      'Re-runs Parseur parsing on an existing document by its ID, typically after a template change so the document is re-evaluated. Requires the document ID and its parser/mailbox. Each call re-triggers processing (and any downstream exports/webhooks), so it is not idempotent.',
    idempotent: false,
  },
  props: {
    parserId: parseurProps.parserId({ required: true }),
    documentId: parseurProps.documentId({ required: true }),
  },
  async run({ auth, propsValue: { documentId } }) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    return await parseurClient.request<ParseurReprocessDocumentResponse>({
      auth,
      method: HttpMethod.POST,
      path: `/document/${documentId}/process`,
    });
  },
});
