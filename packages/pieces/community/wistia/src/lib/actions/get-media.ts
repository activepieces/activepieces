import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenMedia, wistiaApiCall, wistiaCommon, WistiaMedia } from '../common';

export const getMediaAction = createAction({
  auth: wistiaAuth,
  name: 'get_media',
  displayName: 'Get Media',
  description: 'Retrieve the details of a single video or media file.',
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
