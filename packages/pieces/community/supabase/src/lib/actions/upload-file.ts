import { supabaseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';

export const uploadFile = createAction({
  auth: supabaseAuth,
  name: 'upload-file',
  displayName: 'Upload File',
  description: 'Upload a file to Supabase Storage',
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
    const { url, apiKey } = context.auth;
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
