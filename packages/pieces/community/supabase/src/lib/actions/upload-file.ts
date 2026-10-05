import { supabaseAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { uploadFileActionOutputSchema } from '../output-schemas';

export const uploadFile = createAction({
  auth: supabaseAuth,
  name: 'upload-file',
  classification: 'WRITE',
  displayName: 'Upload File',
  description: 'Uploads a file to a Storage bucket.',
  audience: 'both',
  aiMetadata: { description: 'Uploads a file (provided as base64 or a URL) to a Supabase Storage bucket at a given path, then returns its path and public URL; the public URL only resolves for public buckets. Use to persist binary content (images, documents, exports) in object storage rather than a database table. Not idempotent: each call writes the object and errors if the path already exists in the bucket, unless Overwrite Existing File is on, which replaces the existing file.', idempotent: false },
  props: {
    bucket: Property.ShortText({
      displayName: 'Bucket',
      description: "The bucket's name, as shown in Storage.",
      placeholder: 'avatars',
      required: true,
    }),
    filePath: Property.ShortText({
      displayName: 'File Path',
      description: 'Where to save it in the bucket, including the file name.',
      placeholder: 'folder/report.pdf',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'A file from an earlier step, or a URL to download.',
      required: true,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite Existing File',
      description: 'Replaces a file already at this path.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  outputSchema: uploadFileActionOutputSchema,
  async run(context) {
    const { url, apiKey } = context.auth.props;
    const { file, filePath, bucket, overwrite } = context.propsValue;
    const base64 = file.base64;
    const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const supabase = createClient(url, apiKey);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: contentTypeOf({ filePath, fileExtension: file.extension }),
        upsert: overwrite ?? false,
      });
    if (error) {
      throw new Error(error.message);
    }
    const { data: pbData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return {
      publicUrl: pbData.publicUrl,
      path: data.path,
      fullPath: data.fullPath,
    };
  },
});

function contentTypeOf({ filePath, fileExtension }: { filePath: string; fileExtension: string | undefined }): string {
  return mimeTypeOf(extensionOf(filePath))
    ?? mimeTypeOf(fileExtension?.toLowerCase())
    ?? DEFAULT_CONTENT_TYPE;
}

function extensionOf(path: string): string | undefined {
  const lastSegment = path.split('/').pop() ?? '';
  const dotIndex = lastSegment.lastIndexOf('.');
  if (dotIndex === -1) {
    return undefined;
  }
  return lastSegment.slice(dotIndex + 1).toLowerCase();
}

function mimeTypeOf(extension: string | undefined): string | undefined {
  if (extension === undefined) {
    return undefined;
  }
  return MIME_TYPES_BY_EXTENSION.get(extension);
}

const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

const MIME_TYPES_BY_EXTENSION = new Map<string, string>([
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['gif', 'image/gif'],
  ['webp', 'image/webp'],
  ['svg', 'image/svg+xml'],
  ['pdf', 'application/pdf'],
  ['json', 'application/json'],
  ['txt', 'text/plain'],
  ['csv', 'text/csv'],
  ['html', 'text/html'],
  ['mp4', 'video/mp4'],
  ['mp3', 'audio/mpeg'],
  ['wav', 'audio/wav'],
  ['zip', 'application/zip'],
]);
