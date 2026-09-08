import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postwireAuth } from '../auth';
import { postwireCommon, PostWireResponse } from '../common';

type GenerateResponse = { drafts: Record<string, unknown> };

export const writeAndPublish = createAction({
  auth: postwireAuth,
  name: 'write_and_publish',
  displayName: 'Write and Publish',
  description: 'Turn one idea into a native post per network, then publish it.',
  props: {
    platforms: Property.StaticMultiSelectDropdown({
      displayName: 'Networks',
      required: true,
      description: 'Connect these in the PostWire dashboard first.',
      options: { options: postwireCommon.platformOptions() },
    }),
    prompt: Property.LongText({
      displayName: 'Idea',
      required: true,
      description:
        'What you want to say. PostWire rewrites it per network — length, tone, hashtags and link handling — rather than sending the same text everywhere.',
    }),
    mediaUrl: Property.ShortText({
      displayName: 'Media URL',
      required: false,
      description: 'Direct link to an .mp4 or an image. Required by TikTok, YouTube and Instagram.',
    }),
    brandVoice: Property.ShortText({
      displayName: 'Brand Voice',
      required: false,
      description: 'A sentence describing how you want to sound, applied to every draft.',
    }),
    brandId: Property.ShortText({
      displayName: 'Brand',
      required: false,
      description: 'Publish as a specific brand. Leave empty if you only have one.',
    }),
  },
  async run(context) {
    const platforms = context.propsValue.platforms;
    const mediaUrl = context.propsValue.mediaUrl?.trim() ?? '';

    const problem = postwireCommon.mediaProblem(platforms, mediaUrl);
    if (problem !== null) throw new Error(problem);

    const generated = await postwireCommon.request<GenerateResponse>(
      context.auth,
      HttpMethod.POST,
      '/api/generate',
      {
        prompt: context.propsValue.prompt,
        platforms,
        media_url: mediaUrl.length > 0 ? mediaUrl : undefined,
        brand_voice: context.propsValue.brandVoice,
      },
    );

    const body = await postwireCommon.request<PostWireResponse>(
      context.auth,
      HttpMethod.POST,
      '/api/post',
      {
        platforms,
        per_platform: generated.drafts,
        brand_id: context.propsValue.brandId,
        ...postwireCommon.mediaFields(mediaUrl),
      },
    );

    const failure = postwireCommon.allFailed(body.results ?? []);
    if (failure !== null) throw new Error(failure);
    return { drafts: generated.drafts, results: body.results };
  },
});
