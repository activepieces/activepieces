import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listGroups = createAction({
  auth: villageAuth,
  name: 'list_groups',
  classification: 'SEARCH',
  displayName: 'List Groups',
  description:
    'Get all groups (communities) you are a member of. Groups allow members to share network access with each other, expanding everyone\'s reach.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only listing of every group you currently belong to, useful for discovering group_ids needed by Leave Group or Create or Update Group. Takes no input. Pure query, safe to retry.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listGroups,
  props: {},
  async run(context) {
    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/groups`,
    });
    return response;
  },
});
