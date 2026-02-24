import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';

import { vidnozAuth } from '../..';
import { vidnozClient } from '../common/auth';

export const generateVideoWithAvatar = createAction({
  name: 'generate_video_with_avatar',
  displayName: 'Generate Video with Avatar',
  description: 'Generate a video from an avatar.',
  auth: vidnozAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Video Name',
      required: false,
    }),
    aspect: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      required: false,
      defaultValue: 1,
      options: {
        options: [
          { label: '16:9', value: 1 },
          { label: '9:16', value: 2 },
          { label: '1:1', value: 3 },
        ],
      },
    }),
    avatarId: Property.ShortText({
      displayName: 'Avatar',
      description: 'Select the avatar to use.',
      required: true,
    }),
    avatarStyle: Property.StaticDropdown({
      displayName: 'Avatar Style',
      required: false,
      defaultValue: 1,
      options: {
        options: [
          { label: 'Full body', value: 1 },
          { label: 'Half body', value: 2 },
          { label: 'Round', value: 3 },
        ],
      },
    }),
    avatarCircleBgColor: Property.ShortText({
      displayName: 'Avatar Circle Background Color',
      required: false,
    }),
    avatarScale: Property.Number({
      displayName: 'Avatar Scale',
      required: false,
    }),
    avatarOffsetX: Property.Number({
      displayName: 'Avatar Offset X',
      required: false,
    }),
    avatarOffsetY: Property.Number({
      displayName: 'Avatar Offset Y',
      required: false,
    }),
    voiceMode: Property.StaticDropdown({
      displayName: 'Voice Mode',
      required: true,
      defaultValue: 'tts',
      options: {
        options: [
          { label: 'Text to speech', value: 'tts' },
          { label: 'Audio file', value: 'file' },
          { label: 'Silence', value: 'silence' },
        ],
      },
    }),
    voice: Property.DynamicProperties({
      auth: vidnozAuth,
      displayName: 'Voice Settings',
      required: true,
      refreshers: ['voiceMode'],
      props: async ({ voiceMode }) => {
        const fields: DynamicPropsValue = {};

        if (voiceMode === 'tts') {
          fields['ttsVoiceId'] = Property.ShortText({
            displayName: 'Voice',
            description: 'Select the voice to use.',
            required: true,
          });
          fields['ttsText'] = Property.LongText({
            displayName: 'Text',
            required: true,
          });
          fields['ttsSpeed'] = Property.Number({
            displayName: 'Speed',
            required: false,
          });
          fields['ttsPitch'] = Property.Number({
            displayName: 'Pitch',
            required: false,
          });
          fields['ttsEmotion'] = Property.ShortText({
            displayName: 'Emotion',
            required: false,
          });
        }

        if (voiceMode === 'file') {
          fields['fileAssetId'] = Property.ShortText({
            displayName: 'Audio Asset ID',
            required: false,
          });
          fields['fileUrl'] = Property.ShortText({
            displayName: 'Audio URL',
            required: false,
          });
        }

        if (voiceMode === 'silence') {
          fields['silenceDuration'] = Property.Number({
            displayName: 'Silence Duration (seconds)',
            required: true,
            defaultValue: 1,
          });
        }

        return fields;
      },
    }),
    backgroundMode: Property.StaticDropdown({
      displayName: 'Background Mode',
      required: true,
      defaultValue: 'color',
      options: {
        options: [
          { label: 'Solid color', value: 'color' },
          { label: 'Image or video', value: 'media' },
        ],
      },
    }),
    background: Property.DynamicProperties({
      auth: vidnozAuth,
      displayName: 'Background Settings',
      required: true,
      refreshers: ['backgroundMode'],
      props: async ({ backgroundMode }) => {
        const fields: DynamicPropsValue = {};

        if (backgroundMode === 'color') {
          fields['backgroundColor'] = Property.ShortText({
            displayName: 'Background Color',
            required: false,
          });
        }

        if (backgroundMode === 'media') {
          fields['mediaAssetId'] = Property.ShortText({
            displayName: 'Media Asset ID',
            required: false,
          });
          fields['mediaUrl'] = Property.ShortText({
            displayName: 'Media URL',
            required: false,
          });
          fields['mediaFit'] = Property.StaticDropdown({
            displayName: 'Fit Mode',
            required: false,
            defaultValue: 0,
            options: {
              options: [
                { label: 'Contain', value: 0 },
                { label: 'Cover', value: 1 },
              ],
            },
          });
          fields['mediaLoop'] = Property.Checkbox({
            displayName: 'Loop Video',
            required: false,
            defaultValue: false,
          });
        }

        return fields;
      },
    }),
  },
  run: async ({ auth, propsValue }) => {
    const form = new FormData();

    if (propsValue.name) {
      form.append('name', propsValue.name);
    }

    if (propsValue.aspect) {
      form.append('aspect', String(propsValue.aspect));
    }

    form.append('avatar[id]', propsValue.avatarId);

    if (propsValue.avatarStyle !== undefined) {
      form.append('avatar[style]', String(propsValue.avatarStyle));
    }

    if (propsValue.avatarCircleBgColor) {
      form.append('avatar[circle_bgcolor]', propsValue.avatarCircleBgColor);
    }

    if (propsValue.avatarScale !== undefined && propsValue.avatarScale !== null) {
      form.append('avatar[scale]', String(propsValue.avatarScale));
    }

    if (propsValue.avatarOffsetX !== undefined && propsValue.avatarOffsetX !== null) {
      form.append('avatar[offset][x]', String(propsValue.avatarOffsetX));
    }

    if (propsValue.avatarOffsetY !== undefined && propsValue.avatarOffsetY !== null) {
      form.append('avatar[offset][y]', String(propsValue.avatarOffsetY));
    }

    if (propsValue.voiceMode === 'tts') {
      const voice = propsValue.voice as unknown as Record<string, unknown>;

      form.append('voice[tts][id]', String(voice['ttsVoiceId'] ?? ''));
      form.append('voice[tts][text]', String(voice['ttsText'] ?? ''));

      if (voice['ttsSpeed'] !== undefined && voice['ttsSpeed'] !== null) {
        form.append('voice[tts][speed]', String(voice['ttsSpeed']));
      }

      if (voice['ttsPitch'] !== undefined && voice['ttsPitch'] !== null) {
        form.append('voice[tts][pitch]', String(voice['ttsPitch']));
      }

      if (voice['ttsEmotion']) {
        form.append('voice[tts][emotion]', String(voice['ttsEmotion']));
      }
    }

    if (propsValue.voiceMode === 'file') {
      const voice = propsValue.voice as unknown as Record<string, unknown>;

      if (voice['fileAssetId']) {
        form.append('voice[file][asset_id]', String(voice['fileAssetId']));
      }

      if (voice['fileUrl']) {
        form.append('voice[file][url]', String(voice['fileUrl']));
      }
    }

    if (propsValue.voiceMode === 'silence') {
      const voice = propsValue.voice as unknown as Record<string, unknown>;

      form.append('voice[silence][duration]', String(voice['silenceDuration']));
    }

    if (propsValue.backgroundMode === 'color') {
      const background = propsValue.background as unknown as Record<string, unknown>;

      if (background['backgroundColor']) {
        form.append('background[color]', String(background['backgroundColor']));
      }
    }

    if (propsValue.backgroundMode === 'media') {
      const background = propsValue.background as unknown as Record<string, unknown>;

      if (background['mediaAssetId']) {
        form.append('background[media][asset_id]', String(background['mediaAssetId']));
      }

      if (background['mediaUrl']) {
        form.append('background[media][url]', String(background['mediaUrl']));
      }

      if (background['mediaFit'] !== undefined && background['mediaFit'] !== null) {
        form.append('background[media][fit]', String(background['mediaFit']));
      }

      if (
        background['mediaLoop'] !== undefined &&
        background['mediaLoop'] !== null
      ) {
        form.append('background[media][loop]', String(background['mediaLoop']));
      }
    }

    const response = await vidnozClient.makeRequest<{
      code: number;
      message: string;
      data?: {
        task_id?: string;
      };
    }>(auth.secret_text, {
      method: HttpMethod.POST,
      url: '/v2/task/avatar-to-video',
      body: form,
      headers: {
        ...form.getHeaders(),
        accept: 'application/json',
      },
    });

    if (response.code !== 200) {
      throw new Error(response.message || 'Failed to create task');
    }

    return response;
  },
});
