import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropCommons } from '../common';

export const deleteRaindropAction = createAction({
  auth: raindropAuth,
  name: 'delete_raindrop',
  displayName: 'Delete Bookmark',
  description:
    'Moves a bookmark to the trash. To permanently delete it, empty the trash in Raindrop.io.',
  audience: 'both',
  aiMetadata: {
    description:
      'Moves a Raindrop.io bookmark, identified by its numeric ID, to the trash (a soft delete; emptying the trash in Raindrop.io is a separate manual step). Use to remove a bookmark from a user\'s active collections. Not idempotent: a repeat call on an already-trashed or missing ID errors rather than no-ops.',
    idempotent: false,
  },
  props: {
    raindrop_id: Property.ShortText({
      displayName: 'Bookmark ID',
      description:
        'The numeric ID of the bookmark to delete. You can find it in the URL when viewing the bookmark in Raindrop.io (e.g. raindrop.io/app/raindrop/123456789).',
      required: true,
    }),
  },
  async run(context) {
    const { raindrop_id } = context.propsValue;
    const accessToken = context.auth.access_token;

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${raindropCommons.BASE_URL}/raindrop/${raindrop_id}`,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return { success: true, deleted_id: raindrop_id };
  },
});
