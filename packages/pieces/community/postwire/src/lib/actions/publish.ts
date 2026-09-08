import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postwireAuth } from '../auth';
import { postwireCommon, PostWireResponse } from '../common';

export const publish = createAction({
  auth: postwireAuth,
  name: 'publish',
  displayName: 'Publish',
  description: 'Publish the same text to one or more social networks.',
  props: {
    platforms: Property.StaticMultiSelectDropdown({
      displayName: 'Networks',
      required: true,
      description: 'Connect these in the PostWire dashboard first.',
      options: { options: postwireCommon.platformOptions() },
    }),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
      description: 'Anything longer than a network allows is trimmed to fit that network.',
    }),
    mediaUrl: Property.ShortText({
      displayName: 'Media URL',
      required: false,
      description:
        'Direct link to an .mp4 or an image. TikTok and YouTube refuse a post with no video and Instagram needs a photo or video. A Google Drive share link returns a web page, not a file.',
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

    const body = await postwireCommon.request<PostWireResponse>(
      context.auth,
      HttpMethod.POST,
      '/api/post',
      {
        platforms,
        text: context.propsValue.text,
        brand_id: context.propsValue.brandId,
        ...postwireCommon.mediaFields(mediaUrl),
      },
    );

    const failure = postwireCommon.allFailed(body.results ?? []);
    if (failure !== null) throw new Error(failure);
    return body;
  },
});
