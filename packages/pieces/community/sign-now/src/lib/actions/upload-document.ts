import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';

export const uploadDocumentAction = createAction({
  auth: signNowAuth,
  name: 'upload_document',
  displayName: 'Upload Document',
  description:
    'Uploads a document to your SignNow account. Supports PDF, Word, PowerPoint, Excel, images, and more.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a file (PDF, Word, PowerPoint, Excel, image, and more, up to 50 MB) into SignNow as a new document and returns its document ID for later signing or invite steps. Optionally parse simple text tags in the file into fillable fields. Use this as the first step before sending an invite on an ad-hoc file. Each call creates a separate document, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The file to upload. Accepted formats: .pdf, .doc, .docx, .odt, .rtf, .png, .jpg, .jpeg, .gif, .bmp, .xml, .xls, .xlsx, .ppt, .pptx, .ps, .eps. Maximum size: 50 MB.',
      required: true,
    }),
    check_fields: Property.Checkbox({
      displayName: 'Parse Text Tags',
      description:
        'Enable if your document contains simple text tags that should be converted to fillable fields.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { file, check_fields } = context.propsValue;
    const token = getSignNowBearerToken(context.auth);

    const formData = new FormData();
    formData.append('file', Buffer.from(file.base64, 'base64'), file.filename);
    if (check_fields) {
      formData.append('check_fields', 'true');
    }

    const response = await httpClient.sendRequest<{ id: string }>({
      method: HttpMethod.POST,
      url: 'https://api.signnow.com/document',
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return { id: response.body.id };
  },
});
