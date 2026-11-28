import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiGrokEditVideoOutputSchema } from '../../../output-schemas';

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
const RESOLUTIONS = ['480p', '720p', '1080p'];

export const grokGenerateVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_grok_generate_video',
  outputSchema: cometapiGrokEditVideoOutputSchema,
  displayName: 'Generate Grok Video',
  description:
    'Starts a Grok Imagine video generation from text, an image or references.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Grok Imagine Video 1.5 generation (with audio) from text, a source image (Image URL) or reference images and preset voices, returning the request_id; poll it with Get Grok Video. Image URL cannot be combined with references, and reference-to-video is limited to 720p. Use Edit Grok Video to change an existing clip. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description: 'Grok video model ID, e.g. "grok-imagine-video-1.5".',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Describes the scene, motion and audio. Tags such as <IMAGE_0> and <AUDIO_0> refer to references.',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Length in seconds, 1 to 15. Defaults to 8.',
      required: false,
    }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description:
        'Defaults to 16:9 for text-to-video and to the source image ratio for image-to-video.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: ASPECT_RATIOS }),
      },
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Defaults to 480p. Reference-to-video supports up to 720p.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: RESOLUTIONS }),
      },
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description:
        'Source image for image-to-video, as a public URL or image data URI.',
      required: false,
    }),
    referenceImageUrls: Property.Array({
      displayName: 'Reference Image URLs',
      description:
        'Up to 7 public image URLs or data URIs for reference-to-video.',
      required: false,
    }),
    referenceVoiceIds: Property.Array({
      displayName: 'Reference Voice IDs',
      description:
        'Up to 3 preset voice IDs for reference-to-video, e.g. "eve".',
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const referenceImages = (propsValue.referenceImageUrls ?? []).map(
      (url) => ({ url })
    );
    const referenceAudios = (propsValue.referenceVoiceIds ?? []).map(
      (voiceId) => ({ voice_id: voiceId })
    );
    if (
      propsValue.imageUrl &&
      (referenceImages.length > 0 || referenceAudios.length > 0)
    ) {
      throw new Error(
        'Image URL cannot be combined with Reference Image URLs or Reference Voice IDs.'
      );
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/grok/v1/videos/generations',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: propsValue.model,
          prompt: propsValue.prompt,
          duration: propsValue.duration,
          aspect_ratio: propsValue.aspectRatio,
          resolution: propsValue.resolution,
          image: propsValue.imageUrl ? { url: propsValue.imageUrl } : undefined,
          reference_images:
            referenceImages.length > 0 ? referenceImages : undefined,
          reference_audios:
            referenceAudios.length > 0 ? referenceAudios : undefined,
        },
      }),
    });
  },
});
