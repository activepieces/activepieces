import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { filetopdfAuth } from '../auth';
import { filetopdfApi } from '../common/api';
import { filetopdfClient } from '../common/client';
import { filetopdfProps } from '../common/props';
import { filetopdfUtils } from '../common/utils';
import type { FiletopdfPdfEnvelope } from '../common/types';
import { conversionOutputSchema } from '../output-schemas';

export const convertFileAction = createAction({
  auth: filetopdfAuth,
  name: 'convert_file',
  outputSchema: conversionOutputSchema,
  classification: 'READ',
  displayName: 'Convert a File',
  description:
    'Convert an uploaded file or a public file URL to PDF. The engine is chosen automatically from the extension — Office (DOCX, XLSX, PPTX…), images, HTML, Markdown, or PDF passthrough.',
  audience: 'human',
  aiMetadata: {
    description:
      'Converts an existing document to PDF, choosing the rendering engine from the file extension (Office formats, images, HTML, Markdown, or PDF passthrough). Operates in one of two source modes: upload binary file data, or pass a public http(s) file URL the server downloads (private/internal addresses are rejected). Choose this when the agent already has a source file or its URL, rather than raw HTML/Markdown text. Not idempotent: each call performs a fresh conversion on the FileToPDF service that produces a new file and consumes account credits.',
    idempotent: false,
  },
  props: {
    source: Property.StaticDropdown({
      displayName: 'Source',
      description: 'Convert an uploaded file or a public file URL.',
      required: true,
      defaultValue: 'file',
      options: {
        options: [
          { label: 'Upload File', value: 'file' },
          { label: 'File URL', value: 'url' },
        ],
      },
    }),
    input: Property.DynamicProperties({
      auth: filetopdfAuth,
      displayName: 'File',
      required: true,
      refreshers: ['source'],
      props: async ({ source }): Promise<DynamicPropsValue> => {
        if (source === 'url') {
          return {
            url: Property.ShortText({
              displayName: 'File URL',
              description:
                'Public http(s) URL of a file to download and convert. Private/internal addresses are rejected.',
              required: true,
            }),
          };
        }
        return {
          file: Property.File({
            displayName: 'File',
            description:
              'The file to convert — Office (DOCX, XLSX, PPTX…), images, HTML, Markdown, or PDF.',
            required: true,
          }),
        };
      },
    }),
    ...filetopdfProps.fileOptions,
  },
  async run(context) {
    const { source, input, ...rawOptions } = context.propsValue;
    const options = filetopdfUtils.stringifyOptions(rawOptions);

    let envelope: FiletopdfPdfEnvelope;

    if (source === 'url') {
      const url = input['url'];
      if (!url) {
        throw new Error('Provide a File URL to convert.');
      }
      envelope = await filetopdfClient.request<FiletopdfPdfEnvelope>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: '/file',
        body: { url, ...options },
      });
    } else {
      const file = input['file'];
      if (!file) {
        throw new Error('Upload a File to convert.');
      }
      envelope = await filetopdfApi.convertUploadedFile({ auth: context.auth, file, options });
    }

    return await filetopdfUtils.buildConversionOutput({ files: context.files, envelope });
  },
});
