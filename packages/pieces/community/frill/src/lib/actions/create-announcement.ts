import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { frillAuth } from '../auth';
import { frillDropdowns, flattenObject, frillApiCall } from '../common';

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
      body['categories'] = [context.propsValue.category];
    }

    const response = await frillApiCall<{ data: Record<string, unknown> }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/announcements',
      body,
    });

    return flattenObject(response.body.data);
  },
});
