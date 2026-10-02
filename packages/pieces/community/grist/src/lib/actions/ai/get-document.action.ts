import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristGetDocumentOutputSchema } from '../../output-schemas';

export const gristGetDocumentAction = createAction({
  auth: gristAuth,
  name: 'grist_get_document',
  outputSchema: gristGetDocumentOutputSchema,
  displayName: 'Get Document',
  description: 'Gets the metadata of a document.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns a Grist document's name, access level, pinned state and workspace. Use it to confirm a document ID before working on its tables.",
    idempotent: true,
  },
  props: { documentId: commonProps.document_id_text },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    return await client.makeRequest(
      HttpMethod.GET,
      `/docs/${context.propsValue.documentId}`,
      undefined,
      undefined
    );
  },
});
