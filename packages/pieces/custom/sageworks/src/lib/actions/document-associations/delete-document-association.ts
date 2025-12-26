import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteDocumentAssociation = createAction({
  auth: sageworksAuth,
  name: 'document_association_delete',
  displayName: 'Document Association - Delete',
  description: 'Delete a document association by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Document Association ID',
      required: true,
      description: 'The ID of the document association to delete',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/document-associations/${id}`,
      HttpMethod.DELETE
    );
  },
});
