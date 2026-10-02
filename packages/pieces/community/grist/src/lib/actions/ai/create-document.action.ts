import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { gristCreateDocumentOutputSchema } from '../../output-schemas';

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
