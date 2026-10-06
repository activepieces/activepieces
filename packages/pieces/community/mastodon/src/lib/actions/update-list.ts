import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import {
  MastodonEntity,
  mastodonClient,
  mastodonProps,
  mastodonUtils,
} from '../common/client';

const REPLIES_POLICY_OPTIONS = [
  { label: 'Any followed user', value: 'followed' },
  { label: 'Members of the list', value: 'list' },
  { label: 'No one', value: 'none' },
];
import { listOutputSchema } from '../output-schemas';

export const updateList = createAction({
  auth: mastodonAuth,
  name: 'update_list',
  classification: 'WRITE',
  displayName: 'Update List',
  description: 'Rename a list or change its settings.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the title, replies policy or exclusive setting of one of the connected account\'s lists; only the fields you set change. Use Add Accounts to List or Remove Accounts from List to change members. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: listOutputSchema,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'ID of one of your lists. Obtain it from List Lists or Create List.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New name of the list. Leave empty to keep the current title.',
      required: false,
    }),
    replies_policy: Property.StaticDropdown({
      displayName: 'Show Replies To',
      description: 'Which replies appear in the list timeline. Leave empty to keep the current setting.',
      required: false,
      options: { disabled: false, options: REPLIES_POLICY_OPTIONS },
    }),
    exclusive: mastodonProps.optionalBoolean({
      displayName: 'Hide Members From Home Timeline',
      description: 'Whether posts from list members are removed from the home timeline. Leave empty to keep the current setting.',
    }),
  },
  async run(context) {
    const { list_id, title, replies_policy, exclusive } = context.propsValue;
    const body = {
      ...(mastodonUtils.hasValue(title) ? { title } : {}),
      ...(mastodonUtils.hasValue(replies_policy) ? { replies_policy } : {}),
      ...(exclusive !== undefined ? { exclusive } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set Title, Show Replies To or Hide Members From Home Timeline; there is nothing to update.');
    }
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/api/v1/lists/${encodeURIComponent(list_id)}`,
      operation: 'Update List',
      scope: 'write:lists',
      body,
    });
  },
});
