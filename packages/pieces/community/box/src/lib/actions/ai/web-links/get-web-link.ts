import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getWebLinkAction = createAction({
  auth: boxAuth,
  name: 'box_get_web_link',
  displayName: 'Get Web Link',
  description: 'Gets the details of a Box web link.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one web link by ID: its URL, name, description, parent folder and shared link. Get the ID from List Folder Items, Search or Create Web Link.',
    idempotent: true,
  },
  props: {
    webLinkId: boxAiProps.webLinkId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/web_links/${encodeURIComponent(propsValue.webLinkId)}`,
    });
  },
});
