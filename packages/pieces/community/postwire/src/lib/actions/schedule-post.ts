import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postwireAuth } from '../auth';
import { postwireCommon } from '../common';

export const schedulePost = createAction({
  auth: postwireAuth,
  name: 'schedule_post',
  displayName: 'Schedule a Post',
  description: 'Queue a post for a later time. Its rules are checked now, not when it fires.',
  props: {
    platforms: Property.StaticMultiSelectDropdown({
      displayName: 'Networks',
      required: true,
      description: 'Connect these in the PostWire dashboard first.',
      options: { options: postwireCommon.platformOptions() },
    }),
    text: Property.LongText({ displayName: 'Text', required: true }),
    runAt: Property.DateTime({
      displayName: 'Publish At',
      required: true,
      description:
        'PostWire validates the post now, so a missing video is caught here rather than tomorrow morning.',
    }),
    mediaUrl: Property.ShortText({
      displayName: 'Media URL',
      required: false,
      description: 'Direct link to an .mp4 or an image.',
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

    return postwireCommon.request(context.auth, HttpMethod.POST, '/api/schedule', {
      platforms,
      text: context.propsValue.text,
      run_at: context.propsValue.runAt,
      brand_id: context.propsValue.brandId,
      ...postwireCommon.mediaFields(mediaUrl),
    });
  },
});
