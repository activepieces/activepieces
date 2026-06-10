import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenMedia, wistiaApiCall, wistiaCommon, WistiaMedia } from '../common';

export const copyMediaAction = createAction({
  auth: wistiaAuth,
  name: 'copy_media',
  displayName: 'Copy Media',
  description: 'Create a copy of a video or media file, optionally into a different project.',
  props: {
    mediaId: wistiaCommon.mediaDropdown(true),
    projectId: wistiaCommon.projectDropdown(false),
    owner: Property.ShortText({
      displayName: 'New Owner Email',
      description:
        'The email of the user who will own the copy. Defaults to the owner of the original media if left empty.',
      required: false,
    }),
  },
  async run(context) {
    const { mediaId, projectId, owner } = context.propsValue;

    const body: Record<string, string> = {};
    if (projectId !== undefined) body['project_id'] = projectId;
    if (owner !== undefined) body['owner'] = owner;

    const response = await wistiaApiCall<WistiaMedia>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUrl: `/medias/${mediaId}/copy.json`,
      body,
    });

    return flattenMedia(response.body);
  },
});
