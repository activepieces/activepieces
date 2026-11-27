import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteWebLinkAction = createAction({
  auth: boxAuth,
  name: 'box_delete_web_link',
  displayName: 'Delete Web Link',
  description: 'Moves a Box web link to the trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves a web link to the trash, where Restore Web Link can bring it back until the trash is emptied; use Delete Web Link Permanently on a trashed web link to remove it for good. Get the ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    webLinkId: boxAiProps.webLinkId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/web_links/${encodeURIComponent(propsValue.webLinkId)}`,
    });
    return { trashed: true, webLinkId: propsValue.webLinkId };
  },
});
