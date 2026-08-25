import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const listGroups = createAction({
  auth: villageAuth,
  name: 'list_groups',
  displayName: 'List Groups',
  description:
    'Get all groups (communities) you are a member of. Groups allow members to share network access with each other, expanding everyone\'s reach.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only listing of every group you currently belong to, useful for discovering group_ids needed by Leave Group or Create or Update Group. Takes no input. Pure query, safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${VILLAGE_API_BASE_URL}/v2/groups`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
    });
    return response.body;
  },
});
