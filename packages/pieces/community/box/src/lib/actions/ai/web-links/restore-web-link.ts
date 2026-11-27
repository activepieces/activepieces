import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateWebLinkOutputSchema } from '../../../output-schemas';

export const restoreWebLinkAction = createAction({
  auth: boxAuth,
  name: 'box_restore_web_link',
  outputSchema: boxCreateWebLinkOutputSchema,
  displayName: 'Restore Web Link',
  description: 'Restores a Box web link from the trash.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a trashed web link back to its original folder, or to Parent Folder ID if that folder no longer exists. Fails with 409 if an item with the same name is already there; give a new Name. Get the ID from List Trashed Items.',
    idempotent: false,
  },
  props: {
    webLinkId: boxAiProps.webLinkId({
      required: true,
      description: 'Box web link ID, e.g. "49630791796". Get it from List Trashed Items.',
    }),
    name: Property.ShortText({ displayName: 'Name', description: 'New name, to avoid a name conflict.', required: false }),
    parentFolderId: boxAiProps.folderId({
      required: false,
      displayName: 'Parent Folder ID',
      description: 'Folder to restore into, used only if the original folder no longer exists.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/web_links/${encodeURIComponent(propsValue.webLinkId)}`,
      query: { fields: propsValue.fields },
      body: {
        ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
        ...(propsValue.parentFolderId !== undefined ? { parent: { id: propsValue.parentFolderId } } : {}),
      },
    });
  },
});
