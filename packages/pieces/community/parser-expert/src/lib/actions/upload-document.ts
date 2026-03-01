import { createAction, Property } from '@activepieces/pieces-framework';
import { parserExpertAuth } from '../common/auth';
import { parserExpertCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';

export const uploadDocument = createAction({
  auth: parserExpertAuth,
  name: 'upload_document',
  displayName: 'Upload Document',
  description: 'Upload a document or provide a webpage URL to parse. Supported formats: PDF, DOCX, Image, Txt File (maximum 10 pages per document).',
  props: {
    bucket_id: Property.ShortText({
      displayName: 'Bucket ID',
      description: 'The ID of the bucket where the data will be stored. You can find this in your dashboard under Manage Bucket.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload. Supported formats: PDF, DOCX, Image, Txt File (maximum 10 pages per document). This will be ignored if webpage URL is provided.',
      required: false,
    }),
    webpage_url: Property.ShortText({
      displayName: 'Webpage URL',
      description: 'The URL of the webpage to extract content from. This will be ignored if file is provided.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { bucket_id, file, webpage_url } = propsValue;

    if (!file && !webpage_url) {
      throw new Error('Either file or webpage URL must be provided');
    }

    const formData = new FormData();
    formData.append('bucket_id', bucket_id);

    if (file) {
      formData.append('file', file.data, file.filename);
    } else if (webpage_url) {
      formData.append('webpage_url', webpage_url);
    }

    const response = await parserExpertCommon.apiCall<{
      data: {
        parser_id: string;
      };
      message: string;
    }>({
      method: HttpMethod.POST,
      url: '/v1/upload',
      auth: auth.secret_text,
      body: formData,
      headers: formData.getHeaders(),
    });

    return response;
  },
});

