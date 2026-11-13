import { createAction, Property } from '@activepieces/pieces-framework';
import { filetopdfAuth } from '../../auth';
import { filetopdfAiProps } from '../../common/ai-props';
import { filetopdfApi } from '../../common/api';
import { filetopdfUtils } from '../../common/utils';
import { conversionOutputSchema } from '../../output-schemas';

export const aiConvertFileAction = createAction({
  auth: filetopdfAuth,
  name: 'filetopdf_convert_file',
  outputSchema: conversionOutputSchema,
  displayName: 'Convert File to PDF',
  description: 'Convert a document, spreadsheet, presentation or image to a PDF file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Converts an existing file to a PDF file and returns it; the engine is picked from the file extension (Word, Excel, PowerPoint, images, HTML, Markdown, EPUB, Visio, iWork and more, up to 30 MB). Pick it when you have a file or a URL to one; use Convert HTML to PDF or Convert Markdown to PDF for text you hold. Write page ranges as ranges ("1-1", not "1"); a bare page number is ignored. Every call spends one conversion credit (Get Account Status shows what is left), and any option needs the Pro or Scale plan or the free trial.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The file to convert: a URL to it or a file from an earlier step. Its name must end with the real extension (e.g. .docx), which picks the converter.',
      required: true,
    }),
    ...filetopdfAiProps.fileOptions,
  },
  async run(context) {
    const { file, additionalOptions, ...rawOptions } = context.propsValue;
    const options = filetopdfUtils.buildAiOptions({ additionalOptions, options: rawOptions });
    const envelope = await filetopdfApi.convertUploadedFile({ auth: context.auth, file, options });
    return await filetopdfUtils.buildConversionOutput({ files: context.files, envelope });
  },
});
