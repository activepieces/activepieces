import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { docsbotAuth, docsbotCommon } from '../common';

export const uploadSourceFile = createAction({
  auth: docsbotAuth,
  name: 'uploadSourceFile',
  displayName: 'Upload Source File',
  description: 'Upload a file to be used as a source.',
  props: docsbotCommon.uploadSourceFileProperties(),
  async run({ auth: apiKey, propsValue }) {
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
      uploadUrl: presignedUrl.body.url,
      file: file.data,
    });
    return presignedUrl.body;
  },
});
