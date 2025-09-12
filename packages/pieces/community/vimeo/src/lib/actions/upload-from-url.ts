import { Property, createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../../index';
import { vimeoRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const vimeoUploadFromUrl = createAction({
  auth: vimeoAuth,
  name: 'vimeo_upload_from_url',
  displayName: 'Upload Video from URL',
  description: 'Create a video by pulling from a URL (Vimeo pull upload).',
  props: {
    video_url: Property.ShortText({ displayName: 'Video URL', required: true }),
    name: Property.ShortText({ displayName: 'Name (optional)', required: false }),
    description: Property.LongText({ displayName: 'Description (optional)', required: false }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy', required: false,
      options: {
        options: [
          { label: 'Anyone', value: 'anybody' },
          { label: 'Unlisted (link only)', value: 'unlisted' },
          { label: 'Private', value: 'nobody' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    const { video_url, name, description, privacy } = propsValue as any;
    const body: any = {
      upload: { approach: 'pull', link: video_url },
    };
    if (name) body.name = name;
    if (description) body.description = description;
    if (privacy) body.privacy = { view: privacy };

    const res = await vimeoRequest<any>(token, HttpMethod.POST, '/me/videos', body);
    return res.body;
  },
});

