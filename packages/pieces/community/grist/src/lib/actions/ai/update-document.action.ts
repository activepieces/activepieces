import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristDeleteColumnOutputSchema } from '../../output-schemas';

export const gristUpdateDocumentAction = createAction({
  auth: gristAuth,
  name: 'grist_update_document',
  outputSchema: gristDeleteColumnOutputSchema,
  displayName: 'Update Document',
  description: 'Renames or pins/unpins a document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Changes a document's name and/or pinned state; omitted fields are left unchanged. Does not touch document contents. Setting the same values again is a no-op.",
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New document name. Leave empty to keep the current name.',
      required: false,
    }),
    isPinned: Property.StaticDropdown({
      displayName: 'Pinned',
      description: 'Leave unset to keep the current pinned state.',
      required: false,
      options: {
        options: [
          { label: 'Pinned', value: 'true' },
          { label: 'Not pinned', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, name, isPinned } = context.propsValue;
    if (!name && !isPinned) {
      throw new Error('Provide a name or a pinned state to update.');
    }
    await client.makeRequest(
      HttpMethod.PATCH,
      `/docs/${documentId}`,
      undefined,
      undefined,
      {
        ...(name ? { name } : {}),
        ...(isPinned ? { isPinned: isPinned === 'true' } : {}),
      }
    );
    return { success: true };
  },
});
