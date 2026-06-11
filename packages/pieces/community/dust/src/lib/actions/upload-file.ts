import { createAction, Property } from '@activepieces/pieces-framework';

import { createClient } from '../common';
import { dustAuth } from '../..';
import mimeTypes from 'mime-types';
import { FileUploadUrlRequestType } from '@dust-tt/client';

export const uploadFile = createAction({
  name: 'uploadFile',
  displayName: 'Upload file',
  description: 'Upload file to be used in conversation',
  audience: 'both',
  aiMetadata: {
    description:
      'Upload a file to Dust so it can later be referenced (by the returned file ID) when creating a conversation or content fragment. Use this first when you need to feed a file into a conversation. Each call uploads a new file instance, so it is not idempotent.',
    idempotent: false,
  },
  auth: dustAuth,
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
  },
  async run({ auth, propsValue: { file } }) {
    const client = createClient(auth.props);

    const contentType = (mimeTypes.lookup(file.filename) ||
      'text/plain') as FileUploadUrlRequestType['contentType'];

    const blob = new Blob([file.data as unknown as ArrayBuffer], {
      type: contentType,
    });
    const formData = new FormData();
    formData.append('file', blob, file.filename);
    const fileObject = formData.get('file');
    if (!fileObject || typeof fileObject === 'string') {
      throw new Error('File object is missing');
    }

    const response = await client.uploadFile({
      contentType,
      fileObject,
      fileName: file.filename,
      fileSize: blob.size,
      useCase: 'conversation',
    });

    if (response.isErr()) {
      throw new Error(`API Error: ${response.error.message}`);
    }

    return response.value;
  },
});
