import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDocumentFolder = createAction({
  auth: sageworksAuth,
  name: 'document_folder_create',
  displayName: 'Document Folder - Create',
  description: 'Create a new document folder',
  props: {
    data: Property.Json({
      displayName: 'Document Folder Data',
      required: true,
      description: 'Document folder information as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/document-folders',
      HttpMethod.POST,
      data
    );
  },
});
