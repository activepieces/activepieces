import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const getDocumentAssociation = createAction({
  auth: sageworksAuth,
  name: 'document_association_get',
  displayName: 'Document Association - Get',
  description: 'Retrieve a document association by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Document Association ID',
      required: true,
      description: 'The ID of the document association to retrieve',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/document-associations/${id}`,
      HttpMethod.GET
    );
  },
});
