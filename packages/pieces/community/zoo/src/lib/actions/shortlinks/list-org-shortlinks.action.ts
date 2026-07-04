import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listOrgShortlinksAction = createAction({
  name: 'list_org_shortlinks',
  displayName: 'List Organization Shortlinks',
  description: 'List all shortlinks for your organization',
  audience: 'both',
  aiMetadata: { description: 'List the shortlinks belonging to the authenticated user\'s Zoo organization, with optional limit and offset for paging. Read-only and repeatable. Use the user shortlinks action to scope the list to just the current user.', idempotent: true },
  auth: zooAuth,
  // category: 'Shortlinks',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Maximum number of shortlinks to return',
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      description: 'Number of shortlinks to skip',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org/shortlinks',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      queryParams: {
        ...(propsValue.limit && { limit: propsValue.limit.toString() }),
        ...(propsValue.offset && { offset: propsValue.offset.toString() }),
      },
    });
    return response.body;
  },
});
