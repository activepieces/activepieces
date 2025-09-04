import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { VimeoClient } from '../common/client';

export const uploadVideoAction = createAction({
  auth: vimeoAuth,
  name: 'upload-video',
  displayName: 'Upload Video',
  description: 'Upload a video to your Vimeo account',
  props: {
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'The URL of the video file to upload',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Video Name',
      description: 'The name/title of the video',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the video',
      required: false,
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy Setting',
      description: 'Who can view this video',
      required: true,
      defaultValue: 'anybody',
      options: {
        options: [
          { label: 'Anyone', value: 'anybody' },
          { label: 'Only Me', value: 'nobody' },
          { label: 'People I Choose', value: 'contacts' },
          { label: 'People I Follow', value: 'users' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = new VimeoClient(auth);
    const { videoUrl, name, description, privacy } = propsValue;
    
    try {
      const result = await client.uploadVideoFromUrl(
        videoUrl,
        name,
        description || undefined,
        privacy
      );
      
      return {
        success: true,
        video: result,
        message: `Video "${name}" uploaded successfully`,
      };
    } catch (error) {
      throw new Error(`Failed to upload video: ${error}`);
    }
  },
});
