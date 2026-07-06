import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createList = createAction({
  auth: klaviyoAuth,
  name: 'createList',
  displayName: 'Create List',
  description: 'Create a new subscriber list.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new, empty subscriber list in Klaviyo with the given name. Use when you need a fresh list to group profiles into; to find an existing list use Find List by Name. Requires a non-empty name; not idempotent, so each call creates another list even if the name matches an existing one.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name for the new list',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { name } = propsValue;

    if (!name || name.trim().length === 0) {
      throw new Error('List name cannot be empty');
    }

    const data = {
      data: {
        type: 'list',
        attributes: {
          name: name.trim(),
        },
      },
    };

    const response = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.POST,
      '/lists',
      data
    );

    return {
      success: true,
      message: `List "${name}" created successfully`,
      list: response.data,
    };
  },
});
