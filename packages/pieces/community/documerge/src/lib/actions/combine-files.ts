import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { documergeAuth } from '../common/auth';
import { DocuMergeClient } from '../common/client';

export const combineFiles = createAction({
  auth: documergeAuth,
  name: 'combine_files',
  displayName: 'Combine Files',
  description: 'Combine multiple files into a single PDF or DOCX',
  props: {
    output: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'The format of the combined file',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'DOCX', value: 'docx' },
        ],
      },
    }),
    files: Property.Array({
      displayName: 'Files',
      description: 'Array of file identifiers to combine',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name for the combined file',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'URL of a file to include (must be a valid URL)',
      required: false,
    }),
    contents: Property.LongText({
      displayName: 'Contents',
      description: 'Additional content to include',
      required: false,
    }),
  },
  async run(context) {
    const { output, files, name, url, contents } = context.propsValue;

    if (!files || files.length === 0) {
      throw new Error('At least one file is required');
    }

    const client = new DocuMergeClient(context.auth.secret_text);

    const body: Record<string, unknown> = {
      output,
      files: files.filter((f): f is string => typeof f === 'string'),
    };

    if (name) {
      body['name'] = name;
    }

    if (url) {
      body['url'] = url;
    }

    if (contents) {
      body['contents'] = contents;
    }

    const fileData = await client.makeBinaryRequest(
      HttpMethod.POST,
      '/api/tools/combine',
      body
    );

    const fileExtension = output === 'pdf' ? 'pdf' : 'docx';
    const fileName = name
      ? `${name}.${fileExtension}`
      : `combined_file_${Date.now()}.${fileExtension}`;

    const fileUrl = await context.files.write({
      fileName,
      data: Buffer.from(fileData),
    });

    return {
      success: true,
      fileName,
      fileUrl,
      format: output,
      size: fileData.byteLength,
    };
  },
});

