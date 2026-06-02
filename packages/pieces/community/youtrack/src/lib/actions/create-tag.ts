import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { flattenObject, youtrackApiCall } from '../common';

export const createTagAction = createAction({
  auth: youtrackAuth,
  name: 'create_tag',
  displayName: 'Create Tag',
  description: 'Creates a new tag in YouTrack.',
  props: {
    name: Property.ShortText({ displayName: 'Tag Name', description: 'Name like "Regression" or "To deploy".', required: true }),
    untagOnResolve: Property.Checkbox({ displayName: 'Remove when resolved?', required: false, defaultValue: false }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const body: Record<string, unknown> = { name: context.propsValue.name };
    if (context.propsValue.untagOnResolve !== undefined) body['untagOnResolve'] = context.propsValue.untagOnResolve;
    const response = await youtrackApiCall<Record<string, unknown>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/tags',
      queryParams: { fields: 'id,name,owner(id,name),untagOnResolve' },
      body,
    });
    return flattenObject(response.body);
  },
});
