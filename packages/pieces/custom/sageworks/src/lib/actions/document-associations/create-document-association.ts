import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDocumentAssociation = createAction({
  auth: sageworksAuth,
  name: 'document_association_create',
  displayName: 'Document Association - Create',
  description: 'Create a new document association',
  props: {
    data: Property.Json({
      displayName: 'Document Association Data',
      required: true,
      description: 'Document association information as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/document-associations',
      HttpMethod.POST,
      data
    );
  },
});
