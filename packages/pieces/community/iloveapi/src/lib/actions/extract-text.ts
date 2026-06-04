import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { iLoveApi } from '../common/client';

export const extractTextPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'extract_text_pdf',
  displayName: 'Extract Text from PDF',
  description:
    'Extract plain or detailed text (with positions and font metadata) from a PDF.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    detailed: Property.Checkbox({
      displayName: 'Detailed Output',
      description:
        'Include positional and font metadata for each text block. Useful for downstream layout-aware parsing.',
      required: false,
      defaultValue: false,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { file, detailed, output_filename, packaged_filename } =
      context.propsValue;

    const result = await iLoveApi.runTask({
      publicKey: context.auth.secret_text,
      tool: 'extract',
      uploads: [fileToUploadInput(file)],
      options: { detailed: detailed ?? false },
      output_filename,
      packaged_filename,
    });

    const storedFile = await context.files.write({
      fileName: result.downloadFilename,
      data: result.buffer,
    });

    const text = result.buffer.toString('utf-8');
    const detailedJson = parseDetailedJson({ detailed: detailed ?? false, text });

    return {
      output_file: storedFile,
      download_filename: result.downloadFilename,
      output_filenumber: result.process.output_filenumber,
      output_filesize: result.process.output_filesize,
      output_extensions: result.process.output_extensions,
      status: result.process.status,
      text,
      detailed: detailedJson,
    };
  },
});

function parseDetailedJson({
  detailed,
  text,
}: {
  detailed: boolean;
  text: string;
}): unknown {
  if (!detailed) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
