import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import { parseurUtils } from '../../common/utils';
import type { ParseurPage, ParseurRecord } from '../../common/types';
import { documentLogsOutputSchema } from '../../output-schemas';

export const getDocumentLogsAction = createAction({
  auth: parseurAuth,
  name: 'parseur_get_document_logs',
  outputSchema: documentLogsOutputSchema,
  displayName: 'Get Document Logs',
  description: 'Lists the processing log of a document.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the processing log of one Parseur document: each parse, skip, export or webhook attempt with its status and message. Use it to find out why a document failed to parse or export.',
    idempotent: true,
  },
  props: {
    documentId: parseurAiProps.documentId({ required: true }),
    page: parseurAiProps.page({ required: false }),
    limit: parseurAiProps.limit({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurPage<ParseurRecord>>({
      auth,
      method: HttpMethod.GET,
      path: `/document/${encodeURIComponent(propsValue.documentId)}/log_set`,
      query: parseurUtils.pageQuery({
        page: propsValue.page,
        limit: propsValue.limit,
      }),
    });
  },
});
