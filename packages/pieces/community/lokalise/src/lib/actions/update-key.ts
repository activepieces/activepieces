import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown, keyIdProp } from '../common/props';

export const updateKey = createAction({
  auth: lokaliseAuth,
  name: 'updateKey',
  displayName: 'Update Key',
  description: 'Update properties of a key in your Lokalise project',
  props: {
    projectId: projectDropdown,
    keyId: keyIdProp,
    keyName: Property.ShortText({
      displayName: 'Key Name',
      description:
        'Key identifier (or JSON with ios, android, web, other for per-platform names)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the key',
      required: false,
    }),
    platforms: Property.StaticMultiSelectDropdown({
      displayName: 'Platforms',
      description: 'List of platforms enabled for this key',
      required: false,
      options: {
        options: [
          { label: 'iOS', value: 'ios' },
          { label: 'Android', value: 'android' },
          { label: 'Web', value: 'web' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Comma-separated tags for the key',
      required: false,
    }),
    mergeTags: Property.Checkbox({
      displayName: 'Merge Tags',
      description: 'Enable to merge specified tags with current tags',
      required: false,
      defaultValue: false,
    }),
    isPlural: Property.Checkbox({
      displayName: 'Is Plural',
      description: 'Whether this key is plural',
      required: false,
      defaultValue: false,
    }),
    pluralName: Property.ShortText({
      displayName: 'Plural Name',
      description: 'Optional custom plural name',
      required: false,
    }),
    isHidden: Property.Checkbox({
      displayName: 'Is Hidden',
      description: 'Whether this key is hidden from non-admins',
      required: false,
      defaultValue: false,
    }),
    isArchived: Property.Checkbox({
      displayName: 'Is Archived',
      description: 'Whether this key is archived',
      required: false,
      defaultValue: false,
    }),
    context: Property.ShortText({
      displayName: 'Context',
      description: 'Optional context of the key (used with some file formats)',
      required: false,
    }),
    charLimit: Property.ShortText({
      displayName: 'Character Limit',
      description: 'Maximum allowed number of characters in translations',
      required: false,
    }),
  },
  async run(context) {
    const {
      projectId,
      keyId,
      keyName,
      description,
      platforms,
      tags,
      mergeTags,
      isPlural,
      pluralName,
      isHidden,
      isArchived,
      context: keyContext,
      charLimit,
    } = context.propsValue;

    const body: any = {
      ...(keyName && { key_name: keyName }),
      ...(description && { description }),
      ...(platforms && platforms.length > 0 && { platforms }),
      ...(tags && tags.length > 0 && { tags }),
      ...(mergeTags && { merge_tags: true }),
      ...(isPlural !== undefined && { is_plural: isPlural }),
      ...(pluralName && { plural_name: pluralName }),
      ...(isHidden !== undefined && { is_hidden: isHidden }),
      ...(isArchived !== undefined && { is_archived: isArchived }),
      ...(keyContext && { context: keyContext }),
      ...(charLimit && { char_limit: parseInt(charLimit, 10) }),
    };

    const path = `/projects/${projectId}/keys/${keyId}`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.PUT,
      path,
      body
    );

    return response;
  },
});
