import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenMedia, wistiaApiCall, wistiaCommon, WistiaMedia } from '../common';

export const updateMediaAction = createAction({
  auth: wistiaAuth,
  name: 'update_media',
  displayName: 'Update Media',
  description: 'Update the name or description of a video or media file.',
  props: {
    mediaId: wistiaCommon.mediaDropdown(true),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A new name for the media. Leave empty to keep the current name.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'A new description shown next to the media in Wistia. Plain text or Markdown is supported.',
      required: false,
    }),
  },
  async run(context) {
    const { mediaId, name, description } = context.propsValue;

    const body: Record<string, string> = {};
    if (name !== undefined) body['name'] = name;
    if (description !== undefined) body['description'] = description;

    const response = await wistiaApiCall<WistiaMedia>({
      token: context.auth.secret_text,
      method: HttpMethod.PUT,
      resourceUrl: `/medias/${mediaId}.json`,
      body,
    });

    return flattenMedia(response.body);
  },
});
