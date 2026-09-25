import { createAction } from '@activepieces/pieces-framework';
import { listDocuments } from '../api';
import { aconexAuth } from '../auth';
import { assertAuthProps, readAuth } from '../auth-props';
import { documentReturnFieldsProp, documentSearchQueryProp, pageNumberProp, pageSizeProp, projectIdProp } from '../props';

export const listDocumentsAction = createAction({
  auth: aconexAuth,
  name: 'list_documents',
  displayName: 'List Documents',
  description:
    'List one page of current document versions. return_fields tokens are not the JSON keys. The version id is @DocumentId. TrackingId is stable across versions.',
  classification: 'READ',
  props: {
    projectId: projectIdProp,
    searchQuery: documentSearchQueryProp,
    returnFields: documentReturnFieldsProp,
    pageSize: pageSizeProp,
    pageNumber: pageNumberProp,
  },
  async run(context) {
    return listDocuments(assertAuthProps(readAuth(context.auth)), {
      projectId: context.propsValue.projectId,
      searchQuery: context.propsValue.searchQuery,
      returnFields: context.propsValue.returnFields,
      pageSize: context.propsValue.pageSize,
      pageNumber: context.propsValue.pageNumber,
    });
  },
});
