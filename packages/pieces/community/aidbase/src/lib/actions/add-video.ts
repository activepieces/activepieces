import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { aidbaseAuth, aidbaseCommon } from '../../common';
import { AddVideoProperties } from '../../common/properties';
import { AddVideoSchema } from '../../common/schemas';

export const addVideo = createAction({
  auth: aidbaseAuth,
  name: 'addVideo',
  displayName: 'Add Video',
  description:
    'Adds a YouTube video URL as knowledge to the Aidbase knowledge base.',
  props: AddVideoProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, AddVideoSchema);
    return await aidbaseCommon.addVideo({ apiKey, video_type: 'YOUTUBE', ...propsValue });
  },
});
