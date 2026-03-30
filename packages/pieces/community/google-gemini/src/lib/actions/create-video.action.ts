import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { googleGeminiAuth } from '../auth';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime-types';

export const createVideoAction = createAction({
  name: 'create_video',
  auth: googleGeminiAuth,
  displayName: 'Create Video',
  description: 'Generate a video from a text prompt using Google Veo models.',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      defaultValue: 'veo-3.1-generate-preview',
      options: {
        disabled: false,
        options: [
          { label: 'Veo 3.1 Preview', value: 'veo-3.1-generate-preview' },
          {
            label: 'Veo 3.1 Fast Preview',
            value: 'veo-3.1-fast-generate-preview',
          },
          { label: 'Veo 3.0', value: 'veo-3.0-generate-001' },
          { label: 'Veo 3.0 Fast', value: 'veo-3.0-fast-generate-001' },
          { label: 'Veo 2.0', value: 'veo-2.0-generate-001' },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Describe the video you want to generate. Be specific about the scene, motion, style, and lighting for best results.',
      required: true,
    }),
    image: Property.File({
      displayName: 'Start Image',
      description:
        'Optional image to use as the first frame of the video (image-to-video).',
      required: false,
    }),
    lastFrame: Property.File({
      displayName: 'End Image',
      description:
        'Optional image to use as the last frame. Use together with Start Image to generate an interpolation video.',
      required: false,
    }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      required: true,
      defaultValue: '16:9',
      options: {
        disabled: false,
        options: [
          { label: '16:9 (Landscape)', value: '16:9' },
          { label: '9:16 (Portrait)', value: '9:16' },
        ],
      },
    }),
    durationSeconds: Property.Dropdown({
      displayName: 'Duration (seconds)',
      description: 'Must be 8 when using 1080p, 4K, or reference images.',
      required: false,
      auth: googleGeminiAuth,
      refreshers: ['model'],
      defaultValue: 8,
      options: async ({ model }) => {
        const isVeo2 = (model as string)?.startsWith('veo-2');
        if (isVeo2) {
          return {
            disabled: false,
            options: [
              { label: '5 seconds', value: 5 },
              { label: '6 seconds', value: 6 },
              { label: '7 seconds', value: 7 },
              { label: '8 seconds', value: 8 },
            ],
          };
        }
        return {
          disabled: false,
          options: [
            { label: '4 seconds', value: 4 },
            { label: '6 seconds', value: 6 },
            { label: '8 seconds', value: 8 },
          ],
        };
      },
    }),
    resolution: Property.Dropdown({
      displayName: 'Resolution',
      description:
        '1080p is available on Veo 3.0+ only. 4K is only available on Veo 3.1 models. 1080p and 4K require 8-second duration.',
      required: false,
      auth: googleGeminiAuth,
      refreshers: ['model'],
      defaultValue: '720p',
      options: async ({ model }) => {
        const modelStr = model as string;
        const isVeo2 = modelStr?.startsWith('veo-2');
        const is31 = modelStr?.startsWith('veo-3.1');
        return {
          disabled: false,
          options: [
            { label: '720p', value: '720p' },
            ...(isVeo2 ? [] : [{ label: '1080p', value: '1080p' }]),
            ...(is31 ? [{ label: '4K', value: '4k' }] : []),
          ],
        };
      },
    }),
    personGeneration: Property.StaticDropdown({
      displayName: 'Person Generation',
      description:
        'Controls whether people or faces can appear in the generated video.',
      required: false,
      defaultValue: 'allow_adult',
      options: {
        disabled: false,
        options: [
          { label: 'Allow Adults Only (default)', value: 'allow_adult' },
          { label: 'Allow All Ages (requires allowlist)', value: 'allow_all' },
          { label: "Don't Allow People", value: 'dont_allow' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      model,
      prompt,
      image,
      lastFrame,
      aspectRatio,
      durationSeconds,
      resolution,
      personGeneration,
    } = context.propsValue;

    // API reference: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation#sample-request

    const ai = new GoogleGenAI({ apiKey: context.auth.secret_text });

    let operation = await ai.models.generateVideos({
      model,
      prompt,
      ...(image
        ? {
            image: {
              imageBytes: image.base64,
              mimeType:
                mime.lookup(image.extension || image.filename) || 'image/jpeg',
            },
          }
        : {}),
      config: {
        aspectRatio,
        numberOfVideos: 1,
        durationSeconds,
        resolution,
        personGeneration,
        ...(lastFrame
          ? {
              lastFrame: {
                imageBytes: lastFrame.base64,
                mimeType:
                  mime.lookup(lastFrame.extension || lastFrame.filename) ||
                  'image/jpeg',
              },
            }
          : {}),
      },
    });

    const maxWaitMs = 10 * 60 * 1000; // 10 minutes
    const startTime = Date.now();
    while (!operation.done) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error('Video generation timed out after 10 minutes.');
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const video = operation.response?.generatedVideos?.[0]?.video;

    if (!video) {
      throw new Error('No video data returned from model response.');
    }

    let videoBuffer: Buffer;

    if (video.videoBytes) {
      videoBuffer = Buffer.from(video.videoBytes, 'base64');
    } else if (video.uri) {
      const response = await httpClient.sendRequest<ArrayBuffer>({
        method: HttpMethod.GET,
        url: video.uri,
        queryParams: { key: context.auth.secret_text },
        responseType: 'arraybuffer',
      });
      videoBuffer = Buffer.from(response.body);
    } else {
      throw new Error('No video bytes or URI in model response.');
    }

    return await context.files.write({
      data: videoBuffer,
      fileName: 'video.mp4',
    });
  },
});
