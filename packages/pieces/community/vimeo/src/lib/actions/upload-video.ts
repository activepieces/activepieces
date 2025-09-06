import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/common';

export const uploadVideo = createAction({
  auth: vimeoAuth,
  name: 'uploadVideo',
  displayName: 'Upload Video',
  description: 'Upload a video from file or URL',
  props: {
    source: Property.StaticDropdown({
      displayName: 'Source',
      required: true,
      options: {
        options: [
          { label: 'File', value: 'file' },
          { label: 'URL', value: 'url' },
        ],
      },
    }),
    file: Property.File({
      displayName: 'Video File',
      required: false,
      description: 'Provide a video file when Source is File',
    }),
    url: Property.ShortText({
      displayName: 'Video URL',
      required: false,
      description: 'Provide a direct video URL when Source is URL',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The title of the video',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description for the video',
      required: false,
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      description: 'Privacy settings for the video',
      required: false,
      options: {
        options: [
          { label: 'Anybody', value: 'anybody' },
          { label: 'Nobody', value: 'nobody' },
          { label: 'Password', value: 'password' },
          { label: 'Access with private link', value: 'unlisted' },
        ],
      },
      defaultValue: 'anybody',
    }),
    password: Property.DynamicProperties({
      displayName: 'Privacy',
      required: false,
      refreshers: ['privacy'],
      async props(propsValue): Promise<any> {
        const privacy = propsValue['privacy'] as unknown as string;
        if (privacy === 'password') {
          return {
            password: Property.ShortText({
              displayName: 'Password',
              description:
                'Password required to view the video (only if privacy is "password")',
              required: true,
            }),
          };
        }

        return {};
      },
    }),
    allowEmbed: Property.Checkbox({
      displayName: 'Allow Embedding',
      description: 'Allow others to embed this video',
      required: false,
      defaultValue: true,
    }),
    contentRating: Property.Dropdown({
      displayName: 'Content Rating',
      description: 'Content rating for the video',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const vimeo = vimeoCommon.getClient({ auth: auth as OAuth2PropertyValue });
        const response = await vimeo.request({
          path: '/contentratings',
          method: 'GET',
        });

        return {
          options: response.body.data.map((rating: any) => ({
            value: rating.code,
            label: rating.name,
          })),
        };
      },
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'Language code for the video',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const vimeo = vimeoCommon.getClient({ auth: auth as OAuth2PropertyValue });
        const response = await vimeo.request({
          path: '/languages?filter=texttracks',
          method: 'GET',
        });

        return {
          options: response.body.data.map((language: any) => ({
            value: language.code,
            label: `${language.name} (${language.code})`,
          })),
        };
      },
    }),
    license: Property.StaticDropdown({
      displayName: 'License',
      description: 'License for the video',
      required: false,
      options: {
        options: [
          { value: 'by', label: 'Attribution Required' },
          { value: 'by-nc', label: 'Attribution-NonCommercial' },
          { value: 'by-nc-nd', label: 'Attribution-NonCommercial-NoDerivs' },
          { value: 'by-nc-sa', label: 'Attribution-NonCommercial-ShareAlike' },
          { value: 'by-nd', label: 'Attribution-NoDerivs' },
          { value: 'by-sa', label: 'Attribution-ShareAlike' },
          { value: 'cc0', label: 'Public Domain' },
        ],
      },
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const vimeo = vimeoCommon.getClient({ auth });

    const { source, file, url, name, description, privacy } =
      context.propsValue;

    // vimeo provides three approaches for video uploads see
    // https://developer.vimeo.com/api/upload/videos#understanding-upload-approaches

    if (source === 'url') {
      // Pull upload
      const body = {
        upload: { approach: 'pull', link: url },
        name,
        description,
        privacy: privacy ? { view: privacy } : undefined,
      };
      const res = await vimeo.request({
        method: 'POST',
        path: '/me/videos',
        query: body,
      });
      return res;
    }

    // File upload (tus)
    if (!file) {
      throw new Error('Video file is required when Source is File');
    }

    const size = (file.data as Buffer).byteLength;
    const createRes = await vimeo.request({
      method: 'POST',
      path: '/me/videos',
      query: {
        upload: { approach: 'tus', size },
        name,
        description,
        privacy: privacy ? { view: privacy } : undefined,
      },
    });

    const uploadLink = createRes.body?.upload?.upload_link;
    if (!uploadLink) {
      throw new Error('Failed to get upload link from Vimeo');
    }

    // Upload the binary via tus URL
    const data = await file.data;
    const fetch = global.fetch || (await import('node-fetch')).default;
    const tusRes = await fetch(uploadLink, {
      method: 'PATCH',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': '0',
        'Content-Type': 'application/offset+octet-stream',
      },
      body: data,
    });
    if (!tusRes.ok) {
      const text = await tusRes.text();
      throw new Error(`Upload failed: ${tusRes.status} ${text}`);
    }

    // Return the created video object
    return createRes;
  },
});
