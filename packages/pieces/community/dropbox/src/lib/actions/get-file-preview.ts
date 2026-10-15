import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { filePreviewOutputSchema } from '../output-schemas';

export const dropboxGetFilePreview = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_file_preview',
  classification: 'READ',
  displayName: 'Get File Preview',
  description: 'Get a PDF or HTML preview of a document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns a PDF or HTML preview of a Dropbox document and its metadata. Supports office and text formats such as doc, docx, xls, xlsx, ppt, pptx, rtf and csv; use Get File Thumbnail for images. Read-only.',
    idempotent: true,
  },
  outputSchema: filePreviewOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The document to preview. Accepts a path (/folder/report.docx), an id (id:abc123) or a revision (rev:a1c10ce0dd78).',
      required: true,
    }),
  },
  async run(context) {
    const baseName = (context.propsValue.path.match(/[^/]+$/) ?? ['preview'])[0];
    const { data, result, contentType } = await dropboxCommon.download({
      auth: context.auth.access_token,
      path: '/files/get_preview',
      arg: { path: context.propsValue.path },
    });
    const extension = dropboxCommon.previewExtensionFor(contentType);
    return {
      file: await context.files.write({
        fileName: `${baseName.replace(/\.[^.]+$/, '')}.${extension}`,
        data,
      }),
      contentType,
      metadata: result,
    };
  },
});
