import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getTrashedWebLinkAction = createAction({
  auth: boxAuth,
  name: 'box_get_trashed_web_link',
  displayName: 'Get Trashed Web Link',
  description: 'Gets a Box web link that is in the trash.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one trashed web link by ID, including when it was trashed and its original folder; fails with 404 if it is not in the trash. Get the ID from List Trashed Items.',
    idempotent: true,
  },
  props: {
    webLinkId: boxAiProps.webLinkId({
      required: true,
      description: 'Box web link ID, e.g. "49630791796". Get it from List Trashed Items.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/web_links/${encodeURIComponent(propsValue.webLinkId)}/trash`,
      query: { fields: propsValue.fields },
    });
  },
});
