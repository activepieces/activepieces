import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const getDocumentAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_get_document',
  classification: 'READ',
  displayName: 'Get Document',
  description: 'Gets one community document (wiki page) with its Markdown content.',
  audience: 'both',
  aiMetadata: {
    description: "Returns a wiki document's title, link and full Markdown content by ID. Use to read or summarise community knowledge after List Documents. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    documentId: heartbeatProps.id({ displayName: 'Document ID', description: 'Use List Documents to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.document,
  async run({ auth, propsValue }) {
    return heartbeatApi.request<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/documents/${heartbeatApi.uuid({ value: propsValue.documentId, label: 'Document ID' })}`,
      operation: 'get document',
    });
  },
});
