import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const uploadVideo = createAction({
  name: 'upload_video',
  displayName: 'Upload Video',
  description: 'Upload a video to your Vimeo account',
  auth: vimeoAuth,
  props: {
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'URL of the video file to upload',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Video Name',
      description: 'Name for the video',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description for the video',
      required: false,
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      description: 'Privacy setting for the video',
      required: false,
      defaultValue: 'anybody',
      options: {
        options: [
          { value: 'anybody', label: 'Everybody' },
          // { value: 'contacts', label: 'Contacts' }, // Deprecated, let's not add this
          { value: 'disable', label: 'Embeddable but hidden' },
          { value: 'nobody', label: 'Only you' },
          { value: 'password', label: 'Password protected' },
          { value: 'unlisted', label: 'Only can be accessed with private link' },
          // { value: 'users', label: 'Vimeo users' }, // Deprecated, let's not add this
        ],
      },
    }),
    password: Property.DynamicProperties({
      displayName: 'Privacy',
      required: false,
      refreshers: ['privacy'],
      async props(propsValue): Promise<any> {
        let privacy = propsValue['privacy'] as unknown as string;
        if(privacy === 'password') {
          return {
            password: Property.ShortText({
              displayName: 'Password',
              description: 'Password required to view the video (only if privacy is "password")',
              required: true,
            }),
          }
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
    allowDownload: Property.Checkbox({
      displayName: 'Allow Download',
      description: 'Allow others to download this video (not available for free Vimeo users)',
      required: false,
      defaultValue: false,
    }),
    contentRating: Property.Dropdown({
      displayName: 'Content Rating',
      description: 'Content rating for the video',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const response = await apiRequest({
          auth,
          path: '/contentratings',
          method: HttpMethod.GET,
        });

        return {
          options: response.body.data.map((rating: any) => ({
            value: rating.code,
            label: rating.name,
          }))
        };
      },
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'Language code for the video',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        const response = await apiRequest({
          auth,
          path: '/languages?filter=texttracks',
          method: HttpMethod.GET,
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
      defaultValue: '',
      options: {
        options: [
          { value: '', label: 'All Right Reserved' },
          { value: 'by', label: 'Attribution Required' },
          { value: 'by-sa', label: 'Attribution-ShareAlike' },
          { value: 'by-nd', label: 'Attribution-NoDerivs' },
          { value: 'by-nc', label: 'Attribution-NonCommercial' },
          { value: 'by-nc-sa', label: 'Attribution-NonCommercial-ShareAlike' },
          { value: 'by-nc-nd', label: 'Attribution-NonCommercial-NoDerivs' },
          { value: 'cc0', label: 'Public Domain' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { videoUrl, name, description, privacy, password, allowEmbed, allowDownload, contentRating, language, license } = propsValue;

    const uploadData: any = {
      upload: {
        approach: 'pull',
        link: videoUrl,
      },
      name: name,
      privacy: {},
    };

    if (description) uploadData.description = description;
    uploadData.privacy.view = privacy;

    if (allowDownload) uploadData.privacy.download = allowDownload;
    if (password && privacy === 'password') uploadData.password = password;
    uploadData.privacy.embed = allowEmbed ? 'public' : 'private';

    // Add new properties
    if (contentRating) uploadData.content_rating = contentRating;
    if (language) uploadData.locale = language;
    if (license) uploadData.license = license;

    // require a access token with `upload` scope
    let response = await apiRequest({
      auth,
      path: '/me/videos',
      method: HttpMethod.POST,
      body: uploadData,
    });

    let body = response.body;
    body.video_id = body.uri.split('/').pop();

    return body;
  },
});