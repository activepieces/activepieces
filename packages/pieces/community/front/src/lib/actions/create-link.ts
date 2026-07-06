import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLink = createAction({
  auth: frontAuth,
  name: 'createLink',
  displayName: 'Create Link',
  description: 'Create a Link in Front (name, external URL).',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a reusable Front Link from a name and external URL (with an optional regex pattern) that can later be attached to conversations. Use this first when you need a link that does not yet exist before calling "Add Conversation Links". Not idempotent: repeated calls create duplicate links.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the link.',
      required: true,
    }),
    external_url: Property.ShortText({
      displayName: 'External URL',
      description: 'The external URL for the link.',
      required: true,
    }),
    pattern: Property.ShortText({
      displayName: 'Pattern',
      description: 'Optional pattern to match URLs (regex).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, external_url, pattern } = propsValue;
    const body = { name, external_url, pattern };
    return await makeRequest(auth, HttpMethod.POST, '/links', body);
  },
});