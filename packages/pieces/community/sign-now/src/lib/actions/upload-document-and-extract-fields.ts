import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';

export const uploadDocumentAndExtractFieldsAction = createAction({
  auth: signNowAuth,
  name: 'upload_document_and_extract_fields',
  displayName: 'Upload Document & Extract Fields',
  description:
    'Uploads a document and automatically converts text tags into SignNow fillable fields.',
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The file to upload. Text tags in the document (e.g. {{t:s;r:y;o:"Signer 1";}}) will be converted to fillable fields. Accepted formats: .pdf, .doc, .docx, .odt, .rtf, .png, .jpg, .jpeg, .gif, .bmp, .xml, .xls, .xlsx, .ppt, .pptx, .ps, .eps. Maximum size: 50 MB.',
      required: true,
    }),
  },
  async run(context) {
    const { file } = context.propsValue;
    const token = getSignNowBearerToken(context.auth);

    const formData = new FormData();
    formData.append('file', Buffer.from(file.base64, 'base64'), file.filename);
    formData.append('check_fields', 'true');

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
