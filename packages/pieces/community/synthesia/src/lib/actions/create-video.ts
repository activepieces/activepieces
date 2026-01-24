import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { synthesiaAuth } from '../common/auth';

export const createVideo = createAction({
  auth: synthesiaAuth,
  name: 'createVideo',
  displayName: 'Create video',
  description:
    'Create a video within your Synthesia account with one or more scenes',
  props: {
    input_scriptText: Property.LongText({
      displayName: 'Input Script Text',
      description: 'An array of scenes to be included in the video',
      required: true,
    }),
    input_scriptAudioUrl: Property.ShortText({
      displayName: 'Input Script Audio URL',
      description:
        'URL of the audio file to be used for the video script (optional)',
      required: false,
    }),
    input_avatar: Property.ShortText({
      displayName: 'Input Avatar',
      description:
        'The avatar to be used in the video https://docs.synthesia.io/reference/avatars) ',
      required: true,
      defaultValue: 'anna_costume1_cameraA',
    }),

    input_background: Property.StaticDropdown({
      displayName: 'Background',
      description:
        'Background for the video. Can be a stock background, custom asset ID, or URL',
      required: true,
      defaultValue: 'green_screen',
      options: {
        options: [
          { label: 'Green Screen (Transparent)', value: 'green_screen' },
          { label: 'Off White (Solid)', value: 'off_white' },
          { label: 'Warm White (Solid)', value: 'warm_white' },
          { label: 'Light Pink (Solid)', value: 'light_pink' },
          { label: 'Soft Pink (Solid)', value: 'soft_pink' },
          { label: 'Light Blue (Solid)', value: 'light_blue' },
          { label: 'Dark Blue (Solid)', value: 'dark_blue' },
          { label: 'Soft Cyan (Solid)', value: 'soft_cyan' },
          { label: 'Strong Cyan (Solid)', value: 'strong_cyan' },
          { label: 'Light Orange (Solid)', value: 'light_orange' },
          { label: 'Soft Orange (Solid)', value: 'soft_orange' },
          { label: 'White Studio (Image)', value: 'white_studio' },
          { label: 'White Cafe (Image)', value: 'white_cafe' },
          { label: 'Luxury Lobby (Image)', value: 'luxury_lobby' },
          { label: 'Large Window (Image)', value: 'large_window' },
          {
            label: 'White Meeting Room (Image)',
            value: 'white_meeting_room',
          },
          { label: 'Open Office (Image)', value: 'open_office' },
        ],
      },
    }),

    test: Property.Checkbox({
      displayName: 'Test Mode',
      description: 'If enabled, creates a test video with a watermark',
      required: false,
      defaultValue: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Custom title for the video (displayed on the share page)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Custom description for the video (displayed on the share page)',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Video visibility setting',
      required: false,
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Public', value: 'public' },
        ],
      },
      defaultValue: 'private',
    }),
    brandKitId: Property.ShortText({
      displayName: 'Brand Kit ID',
      description:
        'The ID of the brand kit to use (use "workspace_default" for default)',
      required: false,
      defaultValue: 'workspace_default',
    }),
    callbackId: Property.ShortText({
      displayName: 'Callback ID',
      description: 'Arbitrary metadata/identifier for the video',
      required: false,
    }),
    pushServiceUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Webhook URL for push notifications when video completes',
      required: false,
    }),
  },
  async run(context) {
    const {
      input_avatar,
      input_background,
      input_scriptText,
      input_scriptAudioUrl,

      test,
      title,
      description,
      visibility,
      brandKitId,
      callbackId,
      pushServiceUrl,
    } = context.propsValue;

    const body: any = {
      input: {
        script: {
          type: 'text',
          text: input_scriptText,
        },
        avatar: input_avatar,
        background: input_background,
        audio: input_scriptAudioUrl,
      },
      test: test ? 'true' : 'false',
      visibility: visibility || 'private',
    };

    if (title) {
      body.title = title;
    }

    if (description) {
      body.description = description;
    }

    if (brandKitId) {
      body.brandKitId = brandKitId;
    }

    if (callbackId) {
      body.callbackId = callbackId;
    }

    if (pushServiceUrl) {
      body.pushServiceUrl = pushServiceUrl;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.synthesia.io/v2/videos',
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
