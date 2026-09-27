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

export const createList = createAction({
  auth: mastodonAuth,
  name: 'create_list',
  classification: 'WRITE',
  displayName: 'Create List',
  description: 'Create a new list for grouping accounts you follow.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a private list owned by the connected account, used to group followed accounts into a separate timeline. Add members with Add Accounts to List (they must already be followed). Each call creates a new list, even with the same title; check List Lists first to avoid duplicates.',
    idempotent: false,
  },
  outputSchema: listOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Name of the list, for example News.',
      required: true,
    }),
    replies_policy: Property.StaticDropdown({
      displayName: 'Show Replies To',
      description: 'Which replies appear in the list timeline. Leave empty for the default (list members).',
      required: false,
      options: { disabled: false, options: REPLIES_POLICY_OPTIONS },
    }),
    exclusive: mastodonProps.optionalBoolean({
      displayName: 'Hide Members From Home Timeline',
      description: 'Whether posts from list members are removed from the home timeline. Leave empty for the default (no).',
    }),
  },
  async run(context) {
    const { title, replies_policy, exclusive } = context.propsValue;
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/api/v1/lists',
      operation: 'Create List',
      scope: 'write:lists',
      body: {
        title,
        ...(mastodonUtils.hasValue(replies_policy) ? { replies_policy } : {}),
        ...(exclusive !== undefined ? { exclusive } : {}),
      },
    });
  },
});
