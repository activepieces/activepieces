import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteWebLinkPermanentlyOutputSchema } from '../../../output-schemas';

export const deleteWebLinkPermanentlyAction = createAction({
  auth: boxAuth,
  name: 'box_delete_web_link_permanently',
  outputSchema: boxDeleteWebLinkPermanentlyOutputSchema,
  displayName: 'Delete Web Link Permanently',
  description: 'Permanently deletes a Box web link that is in the trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a trashed web link; it cannot be restored. The web link must already be in the trash (Delete Web Link). Get the ID from List Trashed Items.',
    idempotent: false,
  },
  props: {
    webLinkId: boxAiProps.webLinkId({
      required: true,
      description: 'Box web link ID, e.g. "49630791796". Get it from List Trashed Items.',
    }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/web_links/${encodeURIComponent(propsValue.webLinkId)}/trash`,
    });
    return { deleted: true, webLinkId: propsValue.webLinkId };
  },
});
