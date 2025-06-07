import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { heygenAuth } from '../../index';

export const createAvatarVideoAction = createAction({
  auth: heygenAuth,
  name: 'generate_avatar_video',
  displayName: 'Generate Avatar Video',
  description: 'Generate a video using a HeyGen avatar with text-to-speech and customization.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
      description: 'Title of the video.',
    }),
    caption: Property.Checkbox({
      displayName: 'Show Captions',
      required: false,
      defaultValue: false,
      description: 'Whether to show captions in the video.',
    }),
    callbackId: Property.ShortText({
      displayName: 'Callback ID',
      required: false,
      description: 'A custom ID returned in the webhook callback.',
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      required: false,
      description: 'The URL to notify when video rendering is complete.',
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      required: false,
      description: 'The ID of the folder to save the video in.',
    }),
    dimensionWidth: Property.Number({
      displayName: 'Video Width',
      required: false,
      defaultValue: 1280,
      description: 'Width of the video in pixels.',
    }),
    dimensionHeight: Property.Number({
      displayName: 'Video Height',
      required: false,
      defaultValue: 720,
      description: 'Height of the video in pixels.',
    }),
    videoInputs: Property.Array({
      displayName: 'Video Inputs',
      description: 'Array of video input objects including avatar, voice, background, etc.',
      required: true,
      properties: {
        character: Property.Json({
          displayName: 'Character Object',
          required: true,
          description: 'Character object including avatar_id or talking_photo_id.',
        }),
        voice: Property.Json({
          displayName: 'Voice Object',
          required: true,
          description: 'Voice settings including type, voice_id, input_text, etc.',
        }),
        background: Property.Json({
          displayName: 'Background Object',
          required: false,
          description: 'Background object (color, image, or video).',
        }),
        text: Property.Json({
          displayName: 'Text Object',
          required: false,
          description: 'Text overlay object including text, font, color, position, etc.',
        }),
      },
      defaultValue: [],
    }),
  },
  async run({ propsValue, auth }) {

    const {
      title,
      caption,
      callbackId,
      callbackUrl,
      folderId,
      dimensionWidth,
      dimensionHeight,
      videoInputs,
    } = propsValue;

    const apiKey = auth as string;
    const body: Record<string, any> = {
      title,
      caption: caption === true,
      dimension: {
        width: dimensionWidth || 1280,
        height: dimensionHeight || 720,
      },
      video_inputs: videoInputs,
    };

    if (callbackId) body['callback_id'] = callbackId;
    if (callbackUrl) body['callback_url'] = callbackUrl;
    if (folderId) body['folder_id'] = folderId;

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/v2/video/generate',
      body
    );

    return response;
  },
});
