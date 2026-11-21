import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const uploadDocumentAction = createAction({
  auth: signNowAuth,
  name: 'upload_document',
  displayName: 'Upload Document',
  description:
    'Uploads a document to your SignNow account. Supports PDF, Word, PowerPoint, Excel, images, and more.',
  audience: 'both',
  classification: 'WRITE',
  outputSchema: signNowSchemas.documentId,
  aiMetadata: {
    description:
      'Uploads a file (PDF, Word, PowerPoint, Excel, image, and more, up to 50 MB) into SignNow as a new document and returns its document ID for later signing or invite steps. Optionally parse simple text tags in the file into fillable fields. Use this as the first step before sending an invite on an ad-hoc file. Each call creates a separate document, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The document to upload, up to 50 MB.',
      required: true,
    }),
    check_fields: Property.Checkbox({
      displayName: 'Parse Text Tags',
      description: 'Turn on to convert text tags in the file into fillable fields.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { file, check_fields } = context.propsValue;
    return signNowClient.uploadDocument({
      token: getSignNowBearerToken(context.auth),
      file,
      checkFields: check_fields === true,
    });
  },
});
