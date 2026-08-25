import { createAction, Property } from '@activepieces/pieces-framework';
import { omniAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { modelIdDropdown } from '../common/props';

export const createADocument = createAction({
  auth: omniAuth,
  name: 'createADocument',
  displayName: 'Create a document',
  description: 'Creates a new document',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new Omni document (workbook) under a given model, optionally seeding it with query presentations. Use to programmatically provision a document for analysis or dashboards. Not idempotent: each call creates a separate document even with identical inputs.',
    idempotent: false,
  },
  props: {
    modelId: modelIdDropdown,
    name: Property.ShortText({
      displayName: 'Document Name',
      description: 'The name of the document',
      required: true,
    }),
    queryPresentations: Property.Array({
      displayName: 'Query Presentations',
      description:
        "An array of queryPresentation objects, each representing a query in the document's workbook",
      required: false,
    }),
  },
  async run(context) {
    const { modelId, name, queryPresentations } = context.propsValue;

    const body: Record<string, unknown> = {
      modelId,
      name,
    };

    if (queryPresentations) {
      body['queryPresentations'] = queryPresentations;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/documents',
      body
    );

    return response;
  },
});
