import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { runwareAuth } from '../common/auth';

export const generateVideoFromText = createAction({
  name: 'generate_video_from_text',
  displayName: 'Generate Video from Text',
  description: 'Generate video from a text prompt. This is an async task; use the returned Task UUID with a "Get Task Result" action to retrieve the video.',
  auth: runwareAuth,
  props: {
    positivePrompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A detailed description of the video you want to generate.',
      required: true,
    }),
    // UPDATED: Changed from ShortText to a StaticDropdown
    model: Property.StaticDropdown({
        displayName: 'Model',
        description: 'The AI model to use for video generation.',
        required: true,
        options: {
            options: [
                { label: 'Kling', value: 'klingai:5@3' },
                { label: 'Google Veo', value: 'google:3@0' },
                { label: 'PixVerse', value: 'pixverse:1@3' },
                { label: 'MiniMax', value: 'minimax:1@1' },
                { label: 'ByteDance', value: 'bytedance:5@1' },
            ],
        },
        defaultValue: 'klingai:5@3',
    }),
    duration: Property.Number({
        displayName: 'Duration (seconds)',
        description: 'The length of the generated video in seconds. Max 10.',
        required: true,
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt',
      description: 'Describe what you want to avoid in the video (e.g., "blurry, static, flickering").',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'The width of the video in pixels. Must be a multiple of 8.',
      required: false,
      defaultValue: 1024,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'The height of the video in pixels. Must be a multiple of 8.',
      required: false,
      defaultValue: 576,
    }),
    fps: Property.Number({
        displayName: 'FPS',
        description: 'Frames per second for the video. Higher values create smoother motion.',
        required: false,
        defaultValue: 24,
    }),
    steps: Property.Number({
      displayName: 'Steps',
      description: 'Number of denoising steps. More steps typically result in higher quality.',
      required: false,
    }),
    CFGScale: Property.Number({
        displayName: 'CFG Scale',
        description: 'How strictly the model follows your prompt. Recommended range is 6.0-10.0.',
        required: false,
    }),
    seed: Property.Number({
        displayName: 'Seed',
        description: 'A number to control randomness for reproducible results.',
        required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload = {
      taskType: 'videoInference',
      taskUUID: crypto.randomUUID(),
      deliveryMethod: 'async', 
      positivePrompt: propsValue.positivePrompt,
      model: propsValue.model,
      duration: propsValue.duration,
      ...(propsValue.negativePrompt && { negativePrompt: propsValue.negativePrompt }),
      ...(propsValue.width && { width: propsValue.width }),
      ...(propsValue.height && { height: propsValue.height }),
      ...(propsValue.fps && { fps: propsValue.fps }),
      ...(propsValue.steps && { steps: propsValue.steps }),
      ...(propsValue.CFGScale && { CFGScale: propsValue.CFGScale }),
      ...(propsValue.seed && { seed: propsValue.seed }),
    };

    const response = await httpClient.sendRequest<{
      data: {
        taskType: string;
        taskUUID: string;
      }[];
    }>({
      url: 'https://api.runware.ai/v1',
      method: HttpMethod.POST,
      body: [payload], 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
    });

    
    return response.body.data;
  },
});