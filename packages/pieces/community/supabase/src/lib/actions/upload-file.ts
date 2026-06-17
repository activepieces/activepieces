import { supabaseAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';

export const uploadFile = createAction({
  auth: supabaseAuth,
  name: 'upload-file',
  displayName: 'Upload File',
  description: 'Upload a file to Supabase Storage',
  audience: 'both',
  aiMetadata: { description: 'Uploads a file (provided as base64 or a URL) to a Supabase Storage bucket at a given path, then returns its public URL. Use to persist binary content (images, documents, exports) in object storage rather than a database table. Not idempotent: each call writes the object and will error if the path already exists in the bucket.', idempotent: false },
  props: {
    filePath: Property.ShortText({
      displayName: 'File path',
      required: true,
    }),
    bucket: Property.ShortText({
      displayName: 'Bucket',
      required: true,
    }),
    file: Property.File({
      displayName: 'Base64 or URL',
      required: true,
    }),
  },
  async run(context) {
    const { url, apiKey } = context.auth.props;
    const { file, filePath, bucket } = context.propsValue;
    const base64 = file.base64;
    // Convert base64 to array buffer
    const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const supabase = createClient(url, apiKey);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer);
    if (error) {
      throw new Error(error.message);
    }
    const { data: pbData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return {
      publicUrl: pbData.publicUrl,
    };
  },
});
