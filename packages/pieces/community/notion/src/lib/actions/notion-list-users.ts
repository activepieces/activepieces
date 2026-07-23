import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionListUsers = createAction({
  auth: notionAuth,
  name: 'notion_list_users',
  displayName: 'List Users',
  description:
    "Lists the people and bots in the workspace, returning each user's id, name, and type.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the people and bots in the workspace, returning each user\'s id, name, and type. Use to resolve a person\'s name into a user id before assigning them to a People property. Requires the "Read user information" capability. Read-only.',
    idempotent: true,
  },
  props: {
    page_size: Property.Number({
      displayName: 'Page Size',
      description:
        'How many users to return per page (1–100). Defaults to 100.',
      required: false,
    }),
    start_cursor: Property.ShortText({
      displayName: 'Start Cursor',
      description:
        "Pagination cursor from a previous call's next_cursor to fetch the next page.",
      required: false,
    }),
  },
  async run(context) {
    const { page_size, start_cursor } = context.propsValue;

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    try {
      const response = await notion.users.list({
        page_size: page_size ? Math.min(Math.max(page_size, 1), 100) : 100,
        start_cursor: start_cursor || undefined,
      });

      const users = response.results.map((user: any) => ({
        id: user.id,
        name: user.name,
        type: user.type,
        avatar_url: user.avatar_url,
        email: user.person?.email,
      }));

      return {
        users,
        count: users.length,
        has_more: response.has_more,
        next_cursor: response.next_cursor,
      };
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized' ||
        error.code === 'restricted_resource'
      ) {
        throw new Error(
          'Integration lacks the "Read user information" capability. Enable it for your Notion integration to list users.'
        );
      }
      throw error;
    }
  },
});
