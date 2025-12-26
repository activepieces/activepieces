import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteDocument = createAction({
  auth: sageworksAuth,
  name: 'document_delete',
  displayName: 'Document - Delete',
  description: 'Delete a document by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Document ID',
      required: true,
      description: 'The ID of the document to delete',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/documents/${id}`,
      HttpMethod.DELETE
    );
  },
});
