import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateDocument = createAction({
  auth: sageworksAuth,
  name: 'document_update',
  displayName: 'Document - Update',
  description: 'Update an existing document',
  props: {
    id: Property.ShortText({
      displayName: 'Document ID',
      required: true,
      description: 'The ID of the document to update',
    }),
    data: Property.Json({
      displayName: 'Document Data',
      required: true,
      description: 'Document information to update as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id, data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/documents/${id}`,
      HttpMethod.PATCH,
      data
    );
  },
});
