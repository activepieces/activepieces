import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenMedia, wistiaApiCall, wistiaCommon, WistiaMedia } from '../common';

export const getMediaAction = createAction({
  auth: wistiaAuth,
  name: 'get_media',
  displayName: 'Get Media',
  description: 'Retrieve the details of a single video or media file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the full details of a single Wistia media item by its hashed media id. Use when an agent already has a specific media id and needs its current attributes. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    mediaId: wistiaCommon.mediaDropdown(true),
  },
  async run(context) {
    const response = await wistiaApiCall<WistiaMedia>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUrl: `/medias/${context.propsValue.mediaId}.json`,
    });

    return flattenMedia(response.body);
  },
});
