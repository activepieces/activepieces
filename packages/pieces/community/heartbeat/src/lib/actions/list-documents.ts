import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listDocumentsAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_documents',
  classification: 'SEARCH',
  displayName: 'List Documents',
  description: 'Lists the community documents (wiki pages), one page at a time.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists community documents (wiki pages) with ID, title and link, one page at a time. Use to find a document ID for Get Document; pass nextCursor as Starting After for the next page. hasMore can be true on an exactly full last page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: heartbeatProps.limit({ max: 100, defaultValue: 50 }),
    startingAfter: heartbeatProps.startingAfter(),
  },
  outputSchema: heartbeatOutputSchemas.documentList,
  async run({ auth, propsValue }) {
    const pageLimit = heartbeatApi.limit({ value: propsValue.limit, max: 100, defaultValue: 50 });
    const documents = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({
        token: auth.secret_text,
        method: HttpMethod.GET,
        path: '/documents',
        operation: 'list documents',
        query: {
          limit: pageLimit,
          startingAfter: heartbeatApi.optionalUuid({ value: propsValue.startingAfter, label: 'Starting After' }),
        },
      }),
    );
    const page = heartbeatApi.toPage({ items: documents, pageLimit });
    return { documents: page.items, nextCursor: page.nextCursor, hasMore: page.hasMore };
  },
});
