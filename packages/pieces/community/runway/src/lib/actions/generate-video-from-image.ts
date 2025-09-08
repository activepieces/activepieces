import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { runwayAuth } from '../..';

export const generateVideoFromImage = createAction({
  auth: runwayAuth,
  name: 'generate-video-from-image',
  displayName: 'Generate a Video from Image',
  description: 'Generates a video based on image(s) and text prompt.',
  props: {
    image: Property.File({
      displayName: 'Input Image',
      required: true,
      description: 'The image file to use as the starting point for video generation.',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The text prompt describing the motion or changes to apply to the image.',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      description: 'The AI model to use for video generation.',
      options: {
        options: [
          {
            label: 'Gen-3 Alpha',
            value: 'gen-3-alpha',
          },
          {
            label: 'Gen-2',
            value: 'gen-2',
          },
        ],
      },
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Duration of the generated video in seconds.',
      required: false,
      defaultValue: 5,
    }),
    ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      required: false,
      description: 'Aspect ratio for the generated video.',
      options: {
        options: [
          {
            label: '16:9',
            value: '16:9',
          },
          {
            label: '1:1',
            value: '1:1',
          },
          {
            label: '9:16',
            value: '9:16',
          },
        ],
      },
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description: 'Random seed for reproducible results.',
      required: false,
    }),
  },
  async run(context) {
    const {
      image,
      prompt,
      model,
      duration,
      ratio,
      seed,
    } = context.propsValue;

    const imageBase64 = image.base64;

    const requestBody: any = {
      prompt,
      model: model || 'gen-3-alpha',
      image: imageBase64,
    };

    if (duration) requestBody.duration = duration;
    if (ratio) requestBody.ratio = ratio;
    if (seed !== undefined) requestBody.seed = seed;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.runwayml.com/v1/video_generation',
      headers: {
        Authorization: `Bearer ${context.auth.api_key}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    };

    const response = await httpClient.sendRequest(request);

    if (response.body && response.body.task_id) {
      return {
        task_id: response.body.task_id,
        status: response.body.status || 'processing',
        message: 'Video generation started. Use "Get Task Details" action to check progress.',
      };
    }

    if (response.body && response.body.video_url) {
      const videoResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: response.body.video_url,
        responseType: 'arraybuffer',
      });

      return context.files.write({
        data: Buffer.from(videoResponse.body),
        fileName: `runway-video-${Date.now()}.mp4`,
      });
    }

    return response.body;
  },
});
