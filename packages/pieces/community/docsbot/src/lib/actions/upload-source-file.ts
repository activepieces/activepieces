import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { docsbotAuth, docsbotCommon } from '../common';

export const uploadSourceFile = createAction({
  auth: docsbotAuth,
  name: 'uploadSourceFile',
  displayName: 'Upload Source File',
  description: 'Upload a file to be used as a source.',
  audience: 'both',
  aiMetadata: { description: 'Upload a file to DocsBot cloud storage for a given team and bot, returning the storage path to feed into Create Source (for document, wp, csv, or urls types). Use this as the first step before creating a file-based source. Each call uploads the file again, so it is not idempotent.', idempotent: false },
  props: docsbotCommon.uploadSourceFileProperties(),
  async run({ auth: apiKey, propsValue }) {
    console.log("file:", propsValue.file, typeof propsValue.file);
    await propsValidation.validateZod(
      propsValue,
      docsbotCommon.uploadSourceFileSchema
    );

    const { botId, file, teamId } = propsValue;
    const presignedUrl = await docsbotCommon.createPresignedFileUploadURL({
      apiKey,
      teamId,
      botId,
      fileName: file.filename,
    });
    await docsbotCommon.uploadFileToCloudStorage({
      uploadUrl: presignedUrl.url,
      file: file.data,
    });
    return presignedUrl;
  },
});
