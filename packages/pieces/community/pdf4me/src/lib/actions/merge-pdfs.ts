import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf4meAuth } from '../auth';
import { pdf4meCommon } from '../common';

export const mergePdfsAction = createAction({
  auth: pdf4meAuth,
  name: 'merge_pdfs',
  displayName: 'Merge PDF Files',
  description: 'Combines two or more PDF files into a single PDF document.',
  props: {
    file1: Property.File({
      displayName: 'First PDF File',
      description: 'The first PDF file to merge. It will appear first in the merged result.',
      required: true,
    }),
    file2: Property.File({
      displayName: 'Second PDF File',
      description: 'The second PDF file to merge.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Output Filename',
      description: 'Name for the merged PDF file (without the .pdf extension).',
      required: false,
      defaultValue: 'merged',
    }),
  },
  async run(context) {
    const { file1, file2, filename } = context.propsValue;
    const outputName = filename ?? 'merged';

    const response = await pdf4meCommon.callFileApi({
      apiKey: context.auth.secret_text,
      endpoint: '/api/v2/Merge',
      body: {
        docContent: [
          file1.data.toString('base64'),
          file2.data.toString('base64'),
        ],
        docName: `${outputName}.pdf`,
      },
    });

    const fileName = pdf4meCommon.fileNameFromHeaders(
      response.headers,
      `${outputName}.pdf`,
    );

    return {
      file_name: fileName,
      file_data_base64: Buffer.from(response.body).toString('base64'),
      success: true,
    };
  },
});
