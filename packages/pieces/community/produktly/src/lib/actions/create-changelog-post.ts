import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';
import { produktlyProps } from '../common/props';

export const createChangelogPost = createAction({
  auth: produktlyAuth,
  name: 'create_changelog_post',
  displayName: 'Create Changelog Post',
  description: 'Publish a new post inside a changelog. Visible to your users once active.',
  props: {
    changelog: produktlyProps.changelog,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The headline shown to users (e.g. "New: Dark mode is here").',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The body of the post. Supports plain text or HTML.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Optional release date in ISO 8601 format (e.g. 2024-12-15). Defaults to today.',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'If enabled, the post is visible to your users immediately.',
      required: false,
      defaultValue: true,
    }),
    tag_names: Property.Array({
      displayName: 'Tag Names',
      description: 'Optional list of tag names to attach. Must match existing tags (use "List Tags" to find them).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      title: propsValue.title,
      active: propsValue.active ?? true,
    };
    if (propsValue.description) body['description'] = propsValue.description;
    if (propsValue.date) body['date'] = propsValue.date;
    if (Array.isArray(propsValue.tag_names) && propsValue.tag_names.length > 0) {
      body['tagNames'] = propsValue.tag_names;
    }
    const response = await produktlyApiCall<{
      id: number;
      title: string;
      description: string;
      date: string;
      active: boolean;
      tags: Array<{ id: number; name: string; backgroundColor: string; textColor: string }>;
    }>({
      auth,
      method: HttpMethod.POST,
      path: `/changelogs/${propsValue.changelog}/posts`,
      body,
    });
    return {
      post_id: response.body.id,
      post_title: response.body.title,
      post_description: response.body.description,
      post_date: response.body.date,
      post_active: response.body.active,
      post_tags: response.body.tags.map((t) => t.name).join(', '),
    };
  },
});
