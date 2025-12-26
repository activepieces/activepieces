import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const getDocumentFolder = createAction({
  auth: sageworksAuth,
  name: 'document_folder_get',
  displayName: 'Document Folder - Get',
  description: 'Retrieve a document folder by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Document Folder ID',
      required: true,
      description: 'The ID of the document folder to retrieve',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/document-folders/${id}`,
      HttpMethod.GET
    );
  },
});
