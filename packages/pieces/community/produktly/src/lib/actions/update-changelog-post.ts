import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';
import { produktlyProps } from '../common/props';

export const updateChangelogPost = createAction({
  auth: produktlyAuth,
  name: 'update_changelog_post',
  displayName: 'Update Changelog Post',
  description: 'Edit an existing changelog post — change its title, body, tags or visibility.',
  props: {
    changelog: produktlyProps.changelog,
    post_id: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the post to update. Use "List Changelog Posts" to find it.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the post. Leave empty to keep the current one.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New body for the post. Leave empty to keep the current one.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'New release date in ISO 8601 format. Leave empty to keep the current one.',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Toggle whether the post is visible to users.',
      required: false,
    }),
    tag_names: Property.Array({
      displayName: 'Tag Names',
      description: 'Replace the list of tags on the post. Must match existing tags (use "List Tags" to find them).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.title !== undefined) body['title'] = propsValue.title;
    if (propsValue.description !== undefined) body['description'] = propsValue.description;
    if (propsValue.date !== undefined) body['date'] = propsValue.date;
    if (propsValue.active !== undefined) body['active'] = propsValue.active;
    if (Array.isArray(propsValue.tag_names)) body['tagNames'] = propsValue.tag_names;
    const response = await produktlyApiCall<{
      id: number;
      title: string;
      description: string;
      date: string;
      active: boolean;
      tags: Array<{ id: number; name: string; backgroundColor: string; textColor: string }>;
    }>({
      auth,
      method: HttpMethod.PATCH,
      path: `/changelogs/${propsValue.changelog}/posts/${propsValue.post_id}`,
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
