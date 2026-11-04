import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurClient } from '../common/client';
import { parseurProps } from '../common/props';
import type { ParseurCreateDocumentFromFileResponse } from '../common/types';

export const createDocumentFromFileAction = createAction({
  auth: parseurAuth,
  name: 'createDocumentFromFile',
  classification: 'WRITE',
  displayName: 'Create Document from File',
  description: 'Creates new document in mailbox from file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a file (e.g. PDF, image, attachment) into a specified Parseur parser/mailbox as a new document for parsing. Use when the source is a binary file rather than email content. Requires the target parser ID and the file; each upload creates a separate document, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    parserId: parseurProps.parserId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'Select the file to upload',
      required: true,
    }),
  },
  async run({ auth, propsValue: { parserId, file } }) {
    if (!parserId) {
      throw new Error('Parser is required');
    }
    const data = new FormData();
    const uint8 = new Uint8Array(file.data);
    data.append('file', new Blob([uint8]), file.filename);
    data.append('parserId', String(parserId));
    return await parseurClient.request<ParseurCreateDocumentFromFileResponse>({
      auth,
      method: HttpMethod.POST,
      path: `/parser/${parserId}/upload`,
      headers: { 'Content-Type': 'multipart/form-data' },
      body: data,
    });
  },
});
