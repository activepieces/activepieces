import { createAction, Property } from '@activepieces/pieces-framework';
import { getDocumentMetadata } from '../api';
import { aconexAuth } from '../auth';
import { assertAuthProps, readAuth } from '../auth-props';
import { projectIdProp } from '../props';

export const getDocumentMetadataAction = createAction({
  auth: aconexAuth,
  name: 'get_document_metadata',
  displayName: 'Get Document Metadata',
  description:
    'Read register metadata for one document version. sanitizeInvalidXmlCharacters=true is always sent. Fields are not renamed. Author is the API name for the web field Created By.',
  classification: 'READ',
  props: {
    projectId: projectIdProp,
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'Numeric document version id (@DocumentId), not TrackingId.',
      required: true,
    }),
  },
  async run(context) {
    return getDocumentMetadata(
      assertAuthProps(readAuth(context.auth)),
      context.propsValue.projectId,
      context.propsValue.documentId,
    );
  },
});
