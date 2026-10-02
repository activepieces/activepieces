import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristCreateDocumentOutputSchema, gristGetDocumentOutputSchema, gristDeleteColumnOutputSchema } from '../../output-schemas';

export const gristCreateDocumentAction = createAction({
  auth: gristAuth,
  name: 'grist_create_document',
  outputSchema: gristCreateDocumentOutputSchema,
  displayName: 'Create Document',
  description: 'Creates an empty document in a workspace.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new empty Grist document in a workspace and returns its document ID. The workspace ID comes from **List Workspaces**. Not idempotent: each call creates another document.',
    idempotent: false,
  },
  props: {
    workspaceId: Property.Number({
      displayName: 'Workspace ID',
      description: 'Numeric workspace ID from the **List Workspaces** action.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new document.',
      required: false,
    }),
    isPinned: Property.Checkbox({
      displayName: 'Pin Document',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { workspaceId, name, isPinned } = context.propsValue;
    const id = await client.makeRequest<string>(
      HttpMethod.POST,
      `/workspaces/${workspaceId}/docs`,
      undefined,
      undefined,
      { ...(name ? { name } : {}), isPinned: isPinned ?? false }
    );
    return { id };
  },
});

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
