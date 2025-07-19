import { createAction, Property } from '@activepieces/pieces-framework';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

export const uploadResource = createAction({
  name: 'upload_resource',
  displayName: 'Upload Resource',
  description: 'Upload a new image, video, or file to Cloudinary.',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
      description: 'The file to upload.'
    }),
    folder: Property.ShortText({
      displayName: 'Folder',
      required: false,
      description: 'Optional folder to upload the file to.'
    })
  },
  async run({ auth, propsValue }) {
    const { username: apiKey, password: apiSecret } = auth as { username: string; password: string };
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    if (!cloudName) {
      throw new Error('Cloudinary cloud name is required. Set CLOUDINARY_CLOUD_NAME as an environment variable.');
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    // Save the file buffer to a temp file if no filePath is present
    let filePath = (propsValue.file as any).filePath;
    if (!filePath) {
      filePath = path.join('/tmp', propsValue.file.filename);
      fs.writeFileSync(filePath, Buffer.from(propsValue.file.data));
    }
    try {
      const uploadOptions: any = { resource_type: 'auto' };
      if ((propsValue as any).folder) {
        uploadOptions.folder = (propsValue as any).folder;
      }
      const result = await cloudinary.uploader.upload(filePath, uploadOptions);
      return result;
    } catch (e: any) {
      return { success: false, message: e.message };
    } finally {
      // Clean up temp file if we created it
      if (!(propsValue.file as any).filePath && filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
}); 