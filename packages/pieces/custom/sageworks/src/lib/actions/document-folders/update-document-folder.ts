import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateDocumentFolder = createAction({
  auth: sageworksAuth,
  name: 'document_folder_update',
  displayName: 'Document Folder - Update',
  description: 'Update an existing document folder',
  props: {
    id: Property.ShortText({
      displayName: 'Document Folder ID',
      required: true,
      description: 'The ID of the document folder to update',
    }),
    data: Property.Json({
      displayName: 'Document Folder Data',
      required: true,
      description: 'Document folder information to update as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id, data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/document-folders/${id}`,
      HttpMethod.PATCH,
      data
    );
  },
});
