import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionGetUser = createAction({
  auth: notionAuth,
  name: 'notion_get_user',
  displayName: 'Get User',
  description: "Fetches a single workspace user's details by id.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single workspace user\'s details by id (resolve via notion_list_users). Use to confirm a user\'s name/type/email before referencing them. Requires the "Read user information" capability. Read-only.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description:
        'The id of the workspace user to retrieve. Resolve via notion_list_users.',
      required: true,
    }),
  },
  async run(context) {
    const { user_id } = context.propsValue;

    if (!user_id) {
      throw new Error('User ID is required');
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    try {
      const user: any = await notion.users.retrieve({
        user_id: user_id as string,
      });
      return {
        id: user.id,
        name: user.name,
        type: user.type,
        avatar_url: user.avatar_url,
        email: user.person?.email,
        bot: user.bot,
      };
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized' ||
        error.code === 'restricted_resource'
      ) {
        throw new Error(
          'Integration lacks the "Read user information" capability. Enable it for your Notion integration to retrieve users.'
        );
      }
      if (error.code === 'object_not_found') {
        throw new Error(
          'User not found. Resolve a valid user id via notion_list_users.'
        );
      }
      throw error;
    }
  },
});
