import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { frillAuth } from '../../';
import { frillDropdowns, flattenObject } from '../common';

export const createAnnouncement = createAction({
  auth: frillAuth,
  name: 'create_announcement',
  displayName: 'Create Announcement',
  description: 'Publish a changelog or product update announcement.',
  props: {
    name: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the announcement.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The announcement body in Markdown format.',
      required: true,
    }),
    category: frillDropdowns.announcementCategoryDropdown,
    is_published: Property.Checkbox({
      displayName: 'Publish Immediately',
      description: 'Check to publish immediately. Uncheck to save as draft.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
      content: context.propsValue.content,
      is_published: context.propsValue.is_published,
    };
    if (context.propsValue.category) {
      body.categories = [context.propsValue.category];
    }

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: 'https://api.frill.co/v1/announcements',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body,
    });

    return flattenObject(response.body);
  },
});
