import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonUtils } from '../common/client';

const CONTEXT_OPTIONS = [
  { label: 'Home and lists', value: 'home' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Public timelines', value: 'public' },
  { label: 'Conversations (threads)', value: 'thread' },
  { label: 'Profiles', value: 'account' },
];

const FILTER_ACTION_OPTIONS = [
  { label: 'Warn (hide behind a warning)', value: 'warn' },
  { label: 'Hide completely', value: 'hide' },
  { label: 'Blur media (Mastodon 4.4+)', value: 'blur' },
];
import { filterOutputSchema } from '../output-schemas';

export const updateFilter = createAction({
  auth: mastodonAuth,
  name: 'update_filter',
  classification: 'WRITE',
  displayName: 'Update Filter',
  description: 'Change the title, contexts, action or expiry of a content filter.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one of the connected account\'s content filters; only the fields you set are sent. Apply In replaces the whole context list when set. Keywords are not changed here. Setting the same values again converges, so it is safe to retry. Requires Mastodon 4.0 or later.',
    idempotent: true,
  },
  outputSchema: filterOutputSchema,
  props: {
    filter_id: Property.ShortText({
      displayName: 'Filter ID',
      description: 'ID of the filter. Obtain it from List Filters or Create Filter.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New name of the filter. Leave empty to keep the current title.',
      required: false,
    }),
    context: Property.StaticMultiSelectDropdown({
      displayName: 'Apply In',
      description: 'Replaces where the filter applies. Leave empty to keep the current contexts.',
      required: false,
      options: { disabled: false, options: CONTEXT_OPTIONS },
    }),
    filter_action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'What happens to matching posts. Leave empty to keep the current action.',
      required: false,
      options: { disabled: false, options: FILTER_ACTION_OPTIONS },
    }),
    expires_in: Property.Number({
      displayName: 'Expires In (seconds)',
      description: 'New expiry, in seconds from now. Leave empty to keep the current expiry.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const body = {
      ...(mastodonUtils.hasValue(props.title) ? { title: props.title } : {}),
      ...(props.context !== undefined && props.context.length > 0
        ? { context: props.context }
        : {}),
      ...(mastodonUtils.hasValue(props.filter_action) ? { filter_action: props.filter_action } : {}),
      ...(props.expires_in !== undefined && props.expires_in !== null
        ? { expires_in: props.expires_in }
        : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/api/v2/filters/${encodeURIComponent(props.filter_id)}`,
      operation: 'Update Filter',
      scope: 'write:filters',
      minVersion: '4.0.0',
      body,
    });
  },
});
