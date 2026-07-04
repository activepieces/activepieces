import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const createTagAction = createAction({
  auth: simplyprintAuth,
  name: 'create_tag',
  displayName: 'Create or Update Tag',
  description:
    'Create a new custom tag, or rename / re-style an existing one (pass the tag ID to edit).',
  audience: 'both',
  aiMetadata: { description: 'Create a custom tag with a name and badge color, or edit an existing one by passing its tag ID. Pick it to manage the tag catalog itself, not to attach/remove tags from entities (use the attach/detach tools for that). Create mode is not idempotent (a repeat call makes another tag); edit mode by stable ID is idempotent.', idempotent: false },
  props: {
    tagId: Property.Number({
      displayName: 'Tag ID (edit existing)',
      description: 'Numeric tag ID to edit. Omit to create a new tag.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Tag name',
      description: 'Display name (max 32 chars).',
      required: true,
    }),
    badge: Property.StaticDropdown<
      'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'
    >({
      displayName: 'Badge style',
      description: 'Bootstrap badge color used to render the tag.',
      required: true,
      defaultValue: 'primary',
      options: {
        options: [
          { label: 'Primary (blue)', value: 'primary' },
          { label: 'Secondary (gray)', value: 'secondary' },
          { label: 'Success (green)', value: 'success' },
          { label: 'Danger (red)', value: 'danger' },
          { label: 'Warning (yellow)', value: 'warning' },
          { label: 'Info (cyan)', value: 'info' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
      badge: context.propsValue.badge,
    };
    if (typeof context.propsValue.tagId === 'number' && context.propsValue.tagId > 0) {
      body['id'] = context.propsValue.tagId;
    }

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'tags/Create',
      body,
    });
  },
});
