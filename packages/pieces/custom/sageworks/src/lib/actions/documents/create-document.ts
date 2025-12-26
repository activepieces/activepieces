import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDocument = createAction({
  auth: sageworksAuth,
  name: 'document_create',
  displayName: 'Document - Create',
  description: 'Create a new document',
  props: {
    data: Property.Json({
      displayName: 'Document Data',
      required: true,
      description: 'Document information as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/documents',
      HttpMethod.POST,
      data
    );
  },
});
