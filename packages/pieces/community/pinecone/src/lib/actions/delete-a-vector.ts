import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { hostDropdown, vectorsIds } from '../common/props';
import { de } from 'zod/v4/locales';
import { success } from 'zod/v4';

export const deleteAVector = createAction({
  auth: PineconeAuth,
  name: 'deleteAVector',
  displayName: 'Delete a Vector',
  description:
    'Delete vectors from a Pinecone index by IDs or delete all vectors',
  props: {
    host: hostDropdown,
    ids: vectorsIds,
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to delete vectors from (optional)',
      required: false,
    }),

    deleteAll: Property.Checkbox({
      displayName: 'Delete All',
      description: 'Delete all vectors in the namespace (optional)',
      required: false,
      defaultValue: false,
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

    const requestBody: any = {
      deleteAll: propsValue.deleteAll,
    };

    if (propsValue.ids && propsValue.ids.length > 0) {
      requestBody.ids = propsValue.ids;
    }

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    if (propsValue.filter && Object.keys(propsValue.filter).length > 0) {
      requestBody.filter = propsValue.filter;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.host as string,
      HttpMethod.POST,
      '/vectors/delete',
      requestBody
    );

    return {
      success: true,
      message: 'Vector deleted successfully',
    };
  },
});
