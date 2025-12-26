import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateDocumentAssociation = createAction({
  auth: sageworksAuth,
  name: 'document_association_update',
  displayName: 'Document Association - Update',
  description: 'Update an existing document association',
  props: {
    id: Property.ShortText({
      displayName: 'Document Association ID',
      required: true,
      description: 'The ID of the document association to update',
    }),
    data: Property.Json({
      displayName: 'Document Association Data',
      required: true,
      description: 'Document association information to update as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id, data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/document-associations/${id}`,
      HttpMethod.PATCH,
      data
    );
  },
});
