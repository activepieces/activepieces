import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const uploadDocumentAndExtractFieldsAction = createAction({
  auth: signNowAuth,
  name: 'upload_document_and_extract_fields',
  displayName: 'Upload Document & Extract Fields',
  description:
    'Uploads a document and automatically converts text tags into SignNow fillable fields.',
  audience: 'both',
  classification: 'WRITE',
  outputSchema: signNowSchemas.documentId,
  aiMetadata: {
    description:
      'Uploads a file (up to 50 MB) into SignNow as a new document and always parses its embedded text tags (e.g. {{t:s;r:y;...}}) into fillable fields, returning the document ID. Choose this over plain Upload Document when the file already contains SignNow text tags that should become signature/data fields. Each call creates a separate document, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The document to upload, up to 50 MB.',
      required: true,
    }),
  },
  async run(context) {
    const { file } = context.propsValue;
    return signNowClient.uploadDocument({
      token: getSignNowBearerToken(context.auth),
      file,
      checkFields: true,
    });
  },
});
