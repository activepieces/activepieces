import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
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
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The file to convert. Provide this or a File URL — if both are given, the uploaded file wins.',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'File URL',
      description:
        'Public http(s) URL of a file to download and convert. Used only when no File is uploaded. Private/internal addresses are rejected.',
      required: false,
    }),
    ...FILE_OPTION_PROPS,
  },
  async run(context) {
    const { file, url, ...rawOptions } = context.propsValue;
    const options = stringifyOptions(rawOptions as Record<string, unknown>);

    let envelope: PdfJsonEnvelope;

    if (file) {
      // Uploaded binary → multipart/form-data under the `files` field.
      const apFile = file as ApFile;
      const form = new FormData();
      form.append('files', Buffer.from(apFile.data), apFile.filename);
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
    } else if (url) {
      // Remote URL → JSON body; the server downloads it (SSRF-protected).
      envelope = await filetopdfApiCall<PdfJsonEnvelope>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        resourceUri: '/file',
        body: { url, ...options },
      });
    } else {
      throw new Error('Provide a File to upload or a File URL to convert.');
    }

    return buildConversionOutput(context.files, envelope);
  },
});
