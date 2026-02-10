import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';

import { vidnozAuth } from '../..';
import { vidnozClient } from '../common/auth';

type VidnozListTemplatesResponse = {
  code: number;
  message: string;
  data?: {
    templates?: Array<{
      id: string;
      name: string;
      aspect: number;
      scenes: number;
      preview_image_url: string;
      preview_video_url: string;
    }>;
  };
};

export const generateVideoWithTemplate = createAction({
  name: 'generate_video_with_template',
  displayName: 'Generate Video with Template',
  description: 'Generate a video using a template.',
  auth: vidnozAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Video Name',
      required: false,
    }),
    templateId: Property.Dropdown({
      auth: vidnozAuth,
      displayName: 'Template',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Vidnoz account',
            options: [],
          };
        }

        try {
          const response = await vidnozClient.makeRequest<VidnozListTemplatesResponse>(
            auth.secret_text,
            {
              method: HttpMethod.GET,
              url: '/v2/template/list',
              queryParams: {
                personal: 'false',
                limit: '200',
              },
            }
          );

          const templates = response.data?.templates ?? [];

          return {
            disabled: false,
            options: templates.map((t) => ({
              label: t.name,
              value: t.id,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            placeholder: 'Failed to load templates',
            options: [],
          };
        }
      },
    }),
    voices: Property.Array({
      displayName: 'Voices (Per Scene)',
      required: true,
      properties: {
        mode: Property.StaticDropdown({
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
        ttsVoiceId: Property.ShortText({
          displayName: 'TTS Voice ID',
          required: false,
        }),
        ttsText: Property.LongText({
          displayName: 'TTS Text',
          required: false,
        }),
        fileAssetId: Property.ShortText({
          displayName: 'Audio Asset ID',
          required: false,
        }),
        fileUrl: Property.ShortText({
          displayName: 'Audio URL',
          required: false,
        }),
        silenceDuration: Property.Number({
          displayName: 'Silence Duration (seconds)',
          required: false,
          defaultValue: 1,
        }),
      },
    }),
  },
  run: async ({ auth, propsValue }) => {
    const form = new FormData();

    if (propsValue.name) {
      form.append('name', propsValue.name);
    }

    form.append('template_id', String(propsValue.templateId));

    const voices = (propsValue.voices ?? []) as Array<Record<string, unknown>>;

    voices.forEach((v, index) => {
      const mode = String(v['mode'] ?? '');

      if (mode === 'tts') {
        if (v['ttsVoiceId']) {
          form.append(`voices[${index}][tts][id]`, String(v['ttsVoiceId']));
        }
        if (v['ttsText']) {
          form.append(`voices[${index}][tts][text]`, String(v['ttsText']));
        }
      }

      if (mode === 'file') {
        if (v['fileAssetId']) {
          form.append(
            `voices[${index}][file][asset_id]`,
            String(v['fileAssetId'])
          );
        }
        if (v['fileUrl']) {
          form.append(`voices[${index}][file][url]`, String(v['fileUrl']));
        }
      }

      if (mode === 'silence') {
        const duration = v['silenceDuration'] ?? 1;
        form.append(
          `voices[${index}][silence][duration]`,
          String(duration)
        );
      }
    });

    const response = await vidnozClient.makeRequest<{
      code: number;
      message: string;
      data?: {
        task_id?: string;
      };
    }>(auth.secret_text, {
      method: HttpMethod.POST,
      url: '/v2/task/template-to-video',
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
