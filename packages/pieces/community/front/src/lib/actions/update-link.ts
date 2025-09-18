import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const updateLink = createAction({
  auth: frontAuth,
  name: 'update_link',
  displayName: 'Update Link',
  description: 'Update the name or other metadata of a Link.',
  props: {
    link_id: frontProps.link(),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A new custom name or title for the link.',
      required: false,
    }),
    external_url: Property.ShortText({
      displayName: 'External URL',
      description: 'A new external URL for the link to point to.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description:
        'IMPORTANT: This will replace all existing custom fields. Provide a complete JSON object of all fields you want to keep.',
      required: false,
    }),
  },
  async run(context) {
    const { link_id, ...body } = context.propsValue;
    const token = context.auth;

    Object.keys(body).forEach(
      (key) =>
        (body as Record<string, unknown>)[key] === undefined &&
        delete (body as Record<string, unknown>)[key]
    );

    await makeRequest(token, HttpMethod.PATCH, `/links/${link_id}`, body);

    return { success: true };
  },
});
