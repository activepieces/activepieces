import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import type { CometApiMinimaxResponse } from '../../../common/types';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMinimaxCreateVideoOutputSchema } from '../../../output-schemas';

export const minimaxCreateVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_minimax_create_video',
  outputSchema: cometapiMinimaxCreateVideoOutputSchema,
  displayName: 'Create MiniMax Video',
  description: 'Starts a MiniMax Conch (Hailuo) video generation task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async MiniMax Conch (Hailuo) video generation, e.g. minimax-hailuo-02, from a prompt and an optional first-frame image, returning the task_id; poll it with Get MiniMax Video Task, then fetch the download URL with Get MiniMax File. Use Create Video for MiniMax H3 models. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description: 'MiniMax video model ID, e.g. "minimax-hailuo-02".',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describes the video to generate.',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Video length in seconds, e.g. 6.',
      required: false,
    }),
    resolution: Property.ShortText({
      displayName: 'Resolution',
      description:
        'Resolution tier, e.g. "768P". "512P" only works with a First Frame Image.',
      required: false,
    }),
    firstFrameImage: Property.ShortText({
      displayName: 'First Frame Image',
      description: 'Opening frame as a public image URL or base64 data URI.',
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await cometApiClient.request<CometApiMinimaxResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/video_generation',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: propsValue.model,
          prompt: propsValue.prompt,
          duration: propsValue.duration,
          resolution: propsValue.resolution,
          first_frame_image: propsValue.firstFrameImage,
        },
      }),
    });
    cometApiUtils.assertMinimaxSucceeded({ response });
    return response;
  },
});
