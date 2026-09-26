import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { googleGeminiAuth } from '../auth';
import { getGeminiVideoModelOptions } from '../common/common';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime-types';
import { createVideoActionOutputSchema } from '../output-schemas';

export const createVideoAction = createAction({
  audience: 'both',
  name: 'create_video',
  classification: 'READ',
  auth: googleGeminiAuth,
  displayName: 'Create Video',
  description: 'Generate a video from a text prompt using Google Veo models.',
  aiMetadata: { description: 'Generates a short video with a Google Veo model from a text prompt, optionally seeded by a start image (image-to-video) or by both a start and end image (interpolation between those frames), polling the long-running generation job for up to 10 minutes before returning the finished MP4 as a file. Use it whenever the required output is video; text goes through generate_content and speech through text-to-speech. Note the model-dependent limits: 1080p needs Veo 3.0 or newer, 4K needs Veo 3.1, and both require an 8-second duration. Not idempotent: each call renders a new video.', idempotent: false },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the scene, motion, style and lighting you want.',
      required: true,
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Veo model that creates the video.',
      required: true,
      auth: googleGeminiAuth,
      refreshers: [],
      defaultValue: 'veo-3.1-generate-preview',
      options: async ({ auth }) => getGeminiVideoModelOptions({ auth }),
    }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      required: true,
      defaultValue: '16:9',
      display: 'cards',
      options: {
        options: [
          { label: 'Landscape', value: '16:9', description: '16:9' },
          { label: 'Portrait', value: '9:16', description: '9:16' },
        ],
      },
    }),
    durationSeconds: Property.Dropdown({
      displayName: 'Duration',
      description: 'Video length in seconds. 1080p and 4K need 8 seconds.',
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
        '4K needs Veo 3.1. 1080p and 4K need an 8-second video.',
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
    image: Property.File({
      displayName: 'Start Image',
      description: 'Image to use as the first frame of the video.',
      required: false,
      advanced: true,
    }),
    lastFrame: Property.File({
      displayName: 'End Image',
      description: 'Image to use as the last frame. Needs a Start Image.',
      required: false,
      advanced: true,
    }),
    personGeneration: Property.StaticDropdown({
      displayName: 'People in Video',
      description: 'Whether people can appear in the video.',
      required: false,
      advanced: true,
      defaultValue: 'allow_adult',
      options: {
        options: [
          { label: 'Adults Only', value: 'allow_adult' },
          { label: 'All Ages (requires allowlist)', value: 'allow_all' },
          { label: 'No People', value: 'dont_allow' },
        ],
      },
    }),
  },
  outputSchema: createVideoActionOutputSchema,
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
