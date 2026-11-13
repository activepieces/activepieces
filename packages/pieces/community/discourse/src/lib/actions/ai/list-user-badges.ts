import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const listUserBadgesAction = createAction({
  auth: discourseAuth,
  name: 'list_user_badges',
  classification: 'SEARCH',
  displayName: 'List User Badges',
  description: 'Lists the badges a Discourse user has earned.',
  audience: 'ai',
  aiMetadata: {
    description: 'List the badges a Discourse user has been granted, by username, with grant dates. Read-only.',
    idempotent: true,
  },
  props: {
    username: Property.ShortText({ displayName: 'Username', required: true }),
  },
  outputSchema: discourseSchemas.userBadges,
  async run({ auth, propsValue }) {
    const username = discourseInput.name({ value: propsValue.username, label: 'Username' });
    const body = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/user-badges/${username}.json` }),
    );
    const badges = discourseMap.list(body['badges']);
    const items = discourseMap.list(body['user_badges']).map((raw) => discourseMap.userBadge({ raw, badges }));
    return { items, count: items.length, has_more: false };
  },
});
