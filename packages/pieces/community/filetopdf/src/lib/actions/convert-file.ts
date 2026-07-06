import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { filetopdfAuth } from '../common/auth';
import { filetopdfApiCall } from '../common/client';
import { FILE_OPTION_PROPS } from '../common/props';
import {
  stringifyOptions,
  buildConversionOutput,
  PdfJsonEnvelope,
} from '../common/conversion';

export const convertFile = createAction({
  auth: filetopdfAuth,
  name: 'convert_file',
  displayName: 'Convert a File',
  description:
    'Convert an uploaded file or a public file URL to PDF. The engine is chosen automatically from the extension — Office (DOCX, XLSX, PPTX…), images, HTML, Markdown, or PDF passthrough.',
  audience: 'both',
  aiMetadata: {
    description:
      'Converts an existing document to PDF, choosing the rendering engine from the file extension (Office formats, images, HTML, Markdown, or PDF passthrough). Operates in one of two source modes: upload binary file data, or pass a public http(s) file URL the server downloads (private/internal addresses are rejected). Choose this when the agent already has a source file or its URL, rather than raw HTML/Markdown text. The conversion is deterministic with no stored side effect, so re-running on the same input is safe and idempotent.',
    idempotent: true,
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
    ...FILE_OPTION_PROPS,
  },
  async run(context) {
    const { source, input, ...rawOptions } = context.propsValue;
    const options = stringifyOptions(rawOptions);

    let envelope: PdfJsonEnvelope;

    if (source === 'url') {
      const url = input['url'];
      if (!url) {
        throw new Error('Provide a File URL to convert.');
      }
      // Remote URL → JSON body; the server downloads it (SSRF-protected).
      envelope = await filetopdfApiCall<PdfJsonEnvelope>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        resourceUri: '/file',
        body: { url, ...options },
      });
    } else {
      const file = input['file'];
      if (!file) {
        throw new Error('Upload a File to convert.');
      }
      // Uploaded binary → multipart/form-data under the `files` field.
      const form = new FormData();
      form.append('files', Buffer.from(file.data), file.filename);
      for (const [key, value] of Object.entries(options)) {
        form.append(key, value);
      }
      envelope = await filetopdfApiCall<PdfJsonEnvelope>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        resourceUri: '/file',
        body: form,
        headers: form.getHeaders(),
      });
    }

    return buildConversionOutput(context.files, envelope);
  },
});
