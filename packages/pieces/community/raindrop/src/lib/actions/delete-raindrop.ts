import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropCommons } from '../common';

export const deleteRaindropAction = createAction({
  auth: raindropAuth,
  name: 'delete_raindrop',
  displayName: 'Delete Bookmark',
  description:
    'Moves a bookmark to the trash. To permanently delete it, empty the trash in Raindrop.io.',
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
    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${raindropCommons.BASE_URL}/raindrop/${raindrop_id}`,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return { success: true, deleted_id: raindrop_id };
  },
});
