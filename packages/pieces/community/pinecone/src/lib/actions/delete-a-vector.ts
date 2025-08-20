import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteAVector = createAction({
  auth: PineconeAuth,
  name: 'deleteAVector',
  displayName: 'Delete a Vector',
  description:
    'Delete vectors from a Pinecone index by IDs or delete all vectors',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to delete vectors from',
      required: true,
    }),
    deleteAll: Property.Checkbox({
      displayName: 'Delete All Vectors',
      description: 'Delete all vectors in the index/namespace',
      required: false,
      defaultValue: false,
    }),
    ids: Property.Array({
      displayName: 'Vector IDs',
      description:
        'Array of vector IDs to delete (ignored if Delete All is checked)',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Vector ID',
          description: 'Unique identifier for the vector to delete',
          required: true,
        }),
      },
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to delete vectors from (optional)',
      required: false,
    }),
    filter: Property.Object({
      displayName: 'Filter',
      description:
        'Metadata filter to specify which vectors to delete (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {};

    // If deleteAll is true, delete all vectors
    if (propsValue.deleteAll) {
      requestBody.deleteAll = true;
    } else if (propsValue.ids && propsValue.ids.length > 0) {
      // Delete specific vectors by IDs
      requestBody.ids = propsValue.ids.map((item: any) => item.id);
    } else {
      throw new Error(
        'Either provide vector IDs to delete or check "Delete All Vectors"'
      );
    }

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    if (propsValue.filter) {
      requestBody.filter = propsValue.filter;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.indexName,
      HttpMethod.POST,
      '/vectors/delete',
      requestBody
    );

    return response;
  },
});
