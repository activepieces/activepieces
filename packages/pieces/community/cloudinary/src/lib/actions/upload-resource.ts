import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import crypto from 'crypto';

function generateSignature(params: Record<string, any>, apiSecret: string): string {
  // Exclude file, cloud_name, resource_type, api_key
  const keys = Object.keys(params)
    .filter(k => !['file', 'cloud_name', 'resource_type', 'api_key'].includes(k) && params[k] !== undefined && params[k] !== '')
    .sort();
  const toSign = keys.map(k => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
  return signature;
}

function getResourceType(extension: string, filename: string): 'image' | 'video' | 'raw' {
  const ext = (extension || filename.split('.').pop() || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) return 'video';
  return 'raw';
}

export const uploadResource = createAction({
  auth: cloudinaryAuth,
  name: 'uploadResource',
  displayName: 'Upload Resource',
  description: 'Upload a new image, video, or file to Cloudinary.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload to Cloudinary.',
      required: true,
    }),
    public_id: Property.ShortText({
      displayName: 'Public ID',
      description: 'The public ID for the uploaded resource.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { file, public_id } = propsValue;
    const timestamp = Math.floor(Date.now() / 1000);
    const api_key = auth.api_key.trim()
    const api_secret = auth.api_secret.trim()
    const paramsToSign = {
      public_id,
      timestamp,
    };
    const signature = generateSignature(paramsToSign, api_secret);
    const resource_type = getResourceType(file.extension ?? '', file.filename);


    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', Buffer.from(propsValue.file.data), propsValue.file.filename);
    form.append('public_id', propsValue.public_id);
    form.append('signature', signature);
    form.append('api_key', api_key);
    form.append('timestamp', timestamp);


    return await makeRequest(auth, HttpMethod.POST, `/${resource_type}/upload`, form)

  },
});
