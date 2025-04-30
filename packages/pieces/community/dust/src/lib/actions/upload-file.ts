import { createAction, Property } from '@activepieces/pieces-framework';

import { createClient } from '../common';
import { dustAuth, DustAuthType } from '../..';
import mimeTypes from 'mime-types';
import { FileUploadUrlRequestType } from '@dust-tt/client';

export const uploadFile = createAction({
  name: 'uploadFile',
  displayName: 'Upload file',
  description: 'Upload file to be used in conversation',
  auth: dustAuth,
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
  },
  async run({ auth, propsValue: { file } }) {
    const client = createClient(auth as DustAuthType);

    const contentType = (mimeTypes.lookup(file.filename) ||
      'text/plain') as FileUploadUrlRequestType['contentType'];

    const fileObject = new File([file.data], file.filename, {
      type: contentType,
    });

    const response = await client.uploadFile({
      contentType,
      fileObject,
      fileName: file.filename,
      fileSize: fileObject.size,
      useCase: 'conversation',
    });

    if (response.isErr()) {
      throw new Error(`API Error: ${response.error.message}`);
    }

    return response.value;
  },
});
