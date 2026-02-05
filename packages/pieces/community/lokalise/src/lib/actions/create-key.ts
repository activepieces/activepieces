import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';

export const createKey = createAction({
  auth: lokaliseAuth,
  name: 'createKey',
  displayName: 'Create Key',
  description: 'Create one or more keys in your Lokalise project',
  props: {
    projectId: projectDropdown,
    keyName: Property.ShortText({
      displayName: 'Key Name',
      description: 'The name/identifier for the key (e.g., "index.welcome")',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional description for the key',
      required: false,
    }),
    platforms: Property.StaticMultiSelectDropdown({
      displayName: 'Platforms',
      description: 'Select the platforms this key applies to',
      required: true,
      options: {
        options: [
          { label: 'iOS', value: 'ios' },
          { label: 'Android', value: 'android' },
          { label: 'Web', value: 'web' },
          { label: 'Flutter', value: 'flutter' },
          { label: 'React Native', value: 'react_native' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Comma-separated tags for the key (e.g., "urgent,ui")',
      required: false,
    }),
    useAutomations: Property.Checkbox({
      displayName: 'Use Automations',
      description: 'Whether to run automations on the new key translations',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { projectId, keyName, description, platforms, tags, useAutomations } =
      context.propsValue;

    const body = {
      keys: [
        {
          key_name: keyName,
          ...(description && { description }),
          ...(platforms && platforms.length > 0 && { platforms }),
          ...(tags && tags.length > 0 && { tags }),
        },
      ],
      use_automations: useAutomations,
    };

    const path = `/projects/${projectId}/keys`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      path,
      body
    );

    return response;
  },
});
