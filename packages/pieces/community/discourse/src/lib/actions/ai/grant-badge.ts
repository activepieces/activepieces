import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const grantBadgeAction = createAction({
  auth: discourseAuth,
  name: 'grant_badge',
  classification: 'WRITE',
  displayName: 'Grant Badge',
  description: 'Grants a badge to a Discourse user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Grant a badge (numeric badge ID from List Badges) to a Discourse user by username, with an optional reason that must be a link to a post or topic on the forum. Needs an admin key; the user is notified. Badges that allow multiple grants are granted again on each call.',
    idempotent: false,
  },
  props: {
    username: Property.ShortText({ displayName: 'Username', required: true }),
    badge_id: Property.ShortText({ displayName: 'Badge ID', description: 'Numeric badge ID.', required: true }),
    reason: Property.ShortText({ displayName: 'Reason', description: 'Optional link to a post or topic on this forum.', required: false }),
  },
  outputSchema: discourseSchemas.grantedBadge,
  async run({ auth, propsValue }) {
    const username = discourseInput.text({ value: propsValue.username, label: 'Username' });
    const badgeId = discourseInput.id({ value: propsValue.badge_id, label: 'Badge ID' });
    const reason = discourseInput.optionalText(propsValue.reason);
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.POST,
        path: '/user_badges.json',
        body: { username, badge_id: Number(badgeId), ...(reason === undefined ? {} : { reason }) },
      }),
    );
    const badges = discourseMap.list(body['badges']);
    const userBadge = discourseMap.rec(body['user_badge'] ?? discourseMap.list(body['user_badges'])[0]);
    return { ...discourseMap.userBadge({ raw: userBadge, badges }), username };
  },
});
