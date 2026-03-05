import { confluenceAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { spaceIdProp, folderIdProp } from '../common/props';
import { confluenceApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPageAction = createAction({
  auth: confluenceAuth,
  name: 'create-page',
  displayName: 'Create Page',
  description: 'Create a new page in Confluence with custom content',
  props: {
    spaceId: spaceIdProp,
    parentId: folderIdProp,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the page',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body Content',
      description:
        'The content of the page in Confluence storage format (HTML). Example: <p>Hello world</p>',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Whether to publish the page or save as draft',
      required: true,
      defaultValue: 'current',
      options: {
        disabled: false,
        options: [
          { label: 'Published', value: 'current' },
          { label: 'Draft', value: 'draft' },
        ],
      },
    }),
  },
  async run(context) {
    const { spaceId, parentId, title, body, status } = context.propsValue;

    const requestBody: Record<string, unknown> = {
      spaceId,
      title,
      status,
      body: {
        representation: 'storage',
        value: body,
      },
    };

    if (parentId) {
      requestBody.parentId = parentId;
    }

    const response = await confluenceApiCall({
      domain: context.auth.props.confluenceDomain,
      username: context.auth.props.username,
      password: context.auth.props.password,
      method: HttpMethod.POST,
      version: 'v2',
      resourceUri: '/pages',
      body: requestBody,
    });

    return response;
  },
});
