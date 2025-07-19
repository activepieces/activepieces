import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { BASE_URL } from '../common/client';

export const convertFileToUrlAction = createAction({
  name: 'upload-media',
  auth: placidAuth,
  displayName: 'Convert File to URL',
  description:
    'Upload one or more files and get back media URLs to use in Placid templates.',
  props: {
    file1: Property.File({
      displayName: 'File 1',
      required: true,
    }),
    file2: Property.File({
      displayName: 'File 2',
      required: false,
    }),
    file3: Property.File({
      displayName: 'File 3',
      required: false,
    }),
    file4: Property.File({
      displayName: 'File 4',
      required: false,
    }),
    file5: Property.File({
      displayName: 'File 5',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    try {
      const formData = new FormData();

      for (let i = 1; i <= 5; i++) {
        const key = `file${i}` as keyof typeof propsValue;
        const file = propsValue[key];
        if (file) {
          const blob = new Blob([file.data]);
          formData.append(`file${i}`, blob, file.filename);
        }
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${BASE_URL}/media`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
        body: formData,
      });

      return {
        success: true,
        message: 'Files uploaded successfully',
        mediaUrls: response.body,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 401:
          throw new Error(
            'Unauthorized: Invalid API key. Please verify your credentials.'
          );
        case 404:
          throw new Error('Endpoint not found: Check Placid API route.');
        case 429:
          throw new Error(
            'Rate limit exceeded. Please wait before trying again.'
          );
        case 500:
          throw new Error('Internal server error. Please try again later.');
        default:
          throw new Error(
            `Placid API Error (${status || 'Unknown'}): ${message}`
          );
      }
    }
  },
});
