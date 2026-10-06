import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristListAttachmentsOutputSchema } from '../../output-schemas';

export const gristListAttachmentsAction = createAction({
  auth: gristAuth,
  name: 'grist_list_attachments',
  outputSchema: gristListAttachmentsOutputSchema,
  displayName: 'List Attachments',
  description: 'Lists the attachments stored in a document.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns metadata (ID, file name, size, upload time) of the attachments in a document. Use it to get the attachment ID for **Download Attachment**.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    sort: Property.ShortText({
      displayName: 'Sort',
      description:
        'Optional comma-separated fields, prefix `-` for descending.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, sort, limit } = context.propsValue;
    const response = await client.makeRequest<{
      records: { id: number; fields: Record<string, unknown> }[];
    }>(HttpMethod.GET, `/docs/${documentId}/attachments`, undefined, {
      sort: sort || undefined,
      limit: limit ?? undefined,
    });
    return { attachments: response.records, count: response.records.length };
  },
});
