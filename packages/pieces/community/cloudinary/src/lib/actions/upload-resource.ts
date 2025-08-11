import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import crypto from 'crypto';

function generateSignature(params: Record<string, any>, apiSecret: string): string {
  const keys = Object.keys(params)
    .filter(k => !['file', 'cloud_name', 'resource_type', 'api_key'].includes(k) && params[k] !== undefined && params[k] !== '')
    .sort();
  const toSign = keys.map(k => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
  return signature;
}

function getResourceType(extension: string, filename: string): 'image' | 'video' | 'raw' {
  const ext = (extension || filename.split('.').pop() || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'ico'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm', 'ogv', '3gp', 'm4v'].includes(ext)) return 'video';
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
      description: 'The public ID for the uploaded resource. If not specified, a random ID will be generated.',
      required: false,
    }),
    folder: Property.Dropdown({
      displayName: 'Folder',
      description: 'Select an existing folder or type a new folder path (e.g., "samples/animals")',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const response = await makeRequest(auth, HttpMethod.GET, `/folders`);
          const folders = response.folders || [];
          
          return {
            disabled: false,
            options: [
              { label: '(Root - no folder)', value: '' },
              ...folders.map((folder: any) => ({
                label: folder.path,
                value: folder.path,
              })),
            ],
            placeholder: 'Select a folder or type a new path',
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading folders - you can still type a folder path',
          };
        }
      },
    }),
    tags: Property.MultiSelectDropdown({
      displayName: 'Tags',
      description: 'Select existing tags or type new ones',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const response = await makeRequest(auth, HttpMethod.GET, `/tags/image?max_results=100`);
          const tags = response.tags || [];
          
          return {
            disabled: false,
            options: tags.map((tag: string) => ({
              label: tag,
              value: tag,
            })),
            placeholder: 'Select existing tags or type new ones',
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading tags - you can still type tags manually',
          };
        }
      },
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite',
      description: 'Whether to overwrite existing assets with the same public ID.',
      required: false,
      defaultValue: true,
    }),
    use_filename: Property.Checkbox({
      displayName: 'Use Original Filename',
      description: 'Whether to use the original file name as the public ID.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { file, public_id, folder, tags, overwrite, use_filename } = propsValue;
    const timestamp = Math.floor(Date.now() / 1000);
    const api_key = auth.api_key.trim();
    const api_secret = auth.api_secret.trim();
    
    const paramsToSign: Record<string, any> = {
      timestamp,
    };

    if (public_id) paramsToSign['public_id'] = public_id;
    if (folder) paramsToSign['folder'] = folder;
    if (tags && tags.length > 0) paramsToSign['tags'] = tags.join(',');
    if (overwrite !== undefined) paramsToSign['overwrite'] = overwrite;
    if (use_filename !== undefined) paramsToSign['use_filename'] = use_filename;

    const signature = generateSignature(paramsToSign, api_secret);
    const resource_type = getResourceType(file.extension ?? '', file.filename);

    const FormData = (await import('form-data')).default;
    const form = new FormData();
    
    form.append('file', Buffer.from(file.data), file.filename);
    form.append('signature', signature);
    form.append('api_key', api_key);
    form.append('timestamp', timestamp.toString());

    if (public_id) form.append('public_id', public_id);
    if (folder) form.append('folder', folder);
    if (tags && tags.length > 0) form.append('tags', tags.join(','));
    if (overwrite !== undefined) form.append('overwrite', overwrite.toString());
    if (use_filename !== undefined) form.append('use_filename', use_filename.toString());

    return await makeRequest(auth, HttpMethod.POST, `/${resource_type}/upload`, form);
  },
});
