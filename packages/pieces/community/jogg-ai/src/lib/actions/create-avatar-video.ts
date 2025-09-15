import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const createAvatarVideo = createAction({
  name: 'createAvatarVideo',
  displayName: 'Create Avatar Video',
  description: 'Creates an avatar video using JoggAI API',
  auth: joggAiAuth,
  props: {
    screen_style: Property.StaticDropdown({
      displayName: 'Screen Style',
      description: 'Background style',
      required: true,
      options: {
        options: [
          { label: 'With background', value: 1 },
          { label: 'Green screen', value: 2 },
          { label: 'WebM', value: 3 },
        ],
      },
    }),
    avatar_id: Property.Dropdown({
      displayName: 'Avatar',
      description: 'Select an avatar to use',
      required: true,
      refreshers: [],
      async options({ auth }) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Jogg AI account first',
            options: [],
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.jogg.ai/v1/avatars',
            headers: {
              'x-api-key': auth as string,
            },
          });

          const avatars = response.body.data?.avatars || [];
          return {
            options: avatars.map((avatar: any) => ({
              label: avatar.name,
              value: avatar.avatar_id,
            })),
          };
        } catch (error) {
          console.error('Failed to fetch avatars', error);
          return {
            options: [],
            placeholder: 'Unable to load avatars',
          };
        }
      },
    }),
    avatar_type: Property.StaticDropdown({
      displayName: 'Avatar Type',
      description: 'Source type of the avatar',
      required: true,
      options: {
        options: [
          { label: 'Jogg avatar', value: 0 },
          { label: 'Your avatar', value: 1 },
        ],
      },
    }),
    voice_id: Property.Dropdown({
      displayName: 'Voice',
      description: 'Select a voice to use',
      required: true,
      refreshers: [],
      async options({ auth }) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Jogg AI account first',
            options: [],
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.jogg.ai/v1/voices',
            headers: {
              'x-api-key': auth as string,
            },
          });

          const voices = response.body.data?.voices || [];
          return {
            options: voices.map((voice: any) => ({
              label: `${voice.name} (${voice.language}, ${voice.gender}, ${voice.age})`,
              value: voice.voice_id,
            })),
          };
        } catch (error) {
          console.error('Failed to fetch voices', error);
          return {
            options: [],
            placeholder: 'Unable to load voices',
          };
        }
      },
    }),
    script: Property.LongText({
      displayName: 'Script',
      description: 'Script content for the avatar to speak. Must provide either script or audio_url',
      required: false,
    }),
    audio_url: Property.ShortText({
      displayName: 'Audio URL',
      description: 'URL for audio. Must provide either script or audio_url',
      required: false,
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Aspect ratio of the output video',
      required: false,
      defaultValue: 0,
      options: {
        options: [
          { label: '9:16 (Portrait)', value: 0 },
          { label: '16:9 (Landscape)', value: 1 },
          { label: '1:1 (Square)', value: 2 },
        ],
      },
    }),
    caption: Property.Checkbox({
      displayName: 'Caption',
      description: 'Enable subtitles',
      required: false,
      defaultValue: true,
    }),
    video_name: Property.ShortText({
      displayName: 'Video Name',
      description: 'Name of the generated video',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const {
      screen_style,
      avatar_id,
      avatar_type,
      voice_id,
      script,
      audio_url,
      aspect_ratio,
      caption,
      video_name,
    } = propsValue;

    // Zod validation
    await propsValidation.validateZod(propsValue, {
      audio_url: z.string().url('Audio URL must be a valid URL').optional(),
      script: z.string().optional(),
    });

    // Validate that either script or audio_url is provided, but not both
    const hasScript = !!script;
    const hasAudioUrl = !!audio_url;

    if ((hasScript && hasAudioUrl) || (!hasScript && !hasAudioUrl)) {
      throw new Error('You must provide either a script or audio_url, but not both.');
    }

    const requestBody: any = {
      screen_style,
      avatar_id,
      avatar_type,
      voice_id,
    };

    // Add the content source (script or audio_url)
    if (script) {
      requestBody.script = script;
    }
    if (audio_url) {
      requestBody.audio_url = audio_url;
    }

    // Add optional parameters if provided
    if (aspect_ratio !== undefined) {
      requestBody.aspect_ratio = aspect_ratio;
    }
    if (caption !== undefined) {
      requestBody.caption = caption;
    }
    if (video_name) {
      requestBody.video_name = video_name;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.jogg.ai/v1/create_video_from_talking_avatar',
      headers: {
        'x-api-key': auth,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});
