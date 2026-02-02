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
