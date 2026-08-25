import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { wistiaApiCall, wistiaCommon } from '../common';

export const deleteMediaAction = createAction({
  auth: wistiaAuth,
  name: 'delete_media',
  displayName: 'Delete Media',
  description: 'Permanently delete a video or media file from your account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently removes a Wistia media item identified by its hashed media id. Use only when the media should be irreversibly deleted; this cannot be undone. Not idempotent in effect: the first call deletes the media and subsequent calls target a media that no longer exists.',
    idempotent: false,
  },
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
