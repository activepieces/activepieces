import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const listDocumentsByAssociation = createAction({
  auth: sageworksAuth,
  name: 'document_list_by_association',
  displayName: 'Document - List by Association',
  description: 'Retrieve a list of documents by object association',
  props: {
    objectType: Property.ShortText({
      displayName: 'Object Type',
      required: false,
      description: 'The type of object to filter documents by (e.g., customer, loan)',
    }),
    objectId: Property.ShortText({
      displayName: 'Object ID',
      required: false,
      description: 'The ID of the object to filter documents by',
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      description: 'Page number for pagination (starts at 1)',
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      required: false,
      description: 'Number of items per page',
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { objectType, objectId, page, perPage } = propsValue;

    const queryParams: Record<string, any> = {};
    if (objectType) queryParams['objectType'] = objectType;
    if (objectId) queryParams['objectId'] = objectId;
    if (page) queryParams['page'] = page;
    if (perPage) queryParams['perPage'] = perPage;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/documents/by-object-association',
      HttpMethod.GET,
      undefined,
      queryParams
    );
  },
});
