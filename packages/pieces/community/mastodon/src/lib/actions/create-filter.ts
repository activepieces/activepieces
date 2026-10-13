import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import {
  MastodonEntity,
  mastodonClient,
  mastodonProps,
  mastodonUtils,
} from '../common/client';

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

export const createFilter = createAction({
  auth: mastodonAuth,
  name: 'create_filter',
  classification: 'WRITE',
  displayName: 'Create Filter',
  description: 'Create a content filter that hides or warns about matching posts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a content filter for the connected account that warns about, hides or blurs posts matching the given keywords in the chosen contexts, optionally expiring after a duration. Each call creates a new filter; check List Filters first to avoid duplicates. Requires Mastodon 4.0 or later.',
    idempotent: false,
  },
  outputSchema: filterOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Name of the filter, for example Spoilers.',
      required: true,
    }),
    context: Property.StaticMultiSelectDropdown({
      displayName: 'Apply In',
      description: 'Where the filter applies. Choose at least one.',
      required: true,
      options: { disabled: false, options: CONTEXT_OPTIONS },
    }),
    keywords: Property.Array({
      displayName: 'Keywords',
      description: 'Words or phrases to filter, one per item.',
      required: false,
    }),
    whole_word: mastodonProps.optionalBoolean({
      displayName: 'Match Whole Words Only',
      description: 'Applies to every keyword above. Leave empty for the default (no, match inside words too).',
    }),
    filter_action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'What happens to matching posts. Leave empty for the default (warn).',
      required: false,
      options: { disabled: false, options: FILTER_ACTION_OPTIONS },
    }),
    expires_in: Property.Number({
      displayName: 'Expires In (seconds)',
      description: 'Seconds from now until the filter expires, for example 86400 for one day. Leave empty to never expire.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    if (props.context.length === 0) {
      throw new Error('Choose at least one context in Apply In.');
    }
    const keywords = mastodonUtils.toStringArray(props.keywords);
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/api/v2/filters',
      operation: 'Create Filter',
      scope: 'write:filters',
      minVersion: '4.0.0',
      body: {
        title: props.title,
        context: props.context,
        ...(mastodonUtils.hasValue(props.filter_action) ? { filter_action: props.filter_action } : {}),
        ...(props.expires_in !== undefined && props.expires_in !== null
          ? { expires_in: props.expires_in }
          : {}),
        ...(keywords !== undefined
          ? {
              keywords_attributes: keywords.map((keyword) => ({
                keyword,
                ...(props.whole_word !== undefined ? { whole_word: props.whole_word } : {}),
              })),
            }
          : {}),
      },
    });
  },
});
