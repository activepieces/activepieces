import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { wistiaApiCall, wistiaCommon } from '../common';

export const deleteMediaAction = createAction({
  auth: wistiaAuth,
  name: 'delete_media',
  displayName: 'Delete Media',
  description: 'Permanently delete a video or media file from your account.',
  props: {
    mediaId: wistiaCommon.mediaDropdown(true),
  },
  async run(context) {
    await wistiaApiCall({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      resourceUrl: `/medias/${context.propsValue.mediaId}.json`,
    });

    return { success: true, hashed_id: context.propsValue.mediaId };
  },
});
