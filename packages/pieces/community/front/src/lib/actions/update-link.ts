import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { linkIdDropdown } from '../common/dropdown';

export const updateLink = createAction({
  auth: frontAuth,
  name: 'updateLink',
  displayName: 'Update Link',
  description: 'Update the name or external URL of a Link in Front.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update the name and/or external URL of an existing Front Link identified by link ID. Use to edit a link already created with "Create Link"; only the fields you supply change. Idempotent: re-applying the same values yields the same result.',
    idempotent: true,
  },
  props: {
    link_id: linkIdDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name for the link.',
      required: false,
    }),
    external_url: Property.ShortText({
      displayName: 'External URL',
      description: 'The new external URL for the link.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { link_id, name, external_url } = propsValue;
    const path = `/links/${link_id}`;
    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (external_url) body['external_url'] = external_url;
    await makeRequest(auth, HttpMethod.PATCH, path, body);
    return {
      success: true,
      message: `Link ${link_id} updated successfully`,
    };
  },
});
