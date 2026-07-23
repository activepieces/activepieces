import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionMovePage = createAction({
  auth: notionAuth,
  name: 'notion_move_page',
  displayName: 'Move Page',
  description:
    'Moves a page under a different parent page (or into a database as a row).',
  audience: 'ai',
  aiMetadata: {
    description:
      "Moves a page under a different parent page (or into a database as a row). Use to reorganize a page by id; supply exactly one of the two parent ids (resolve via notion_search). Safe to retry — re-moving to the same parent is a no-op. Note: the API may reject re-parenting some workspace-level pages, and moving into a database requires the page's properties to match the database schema.",
    idempotent: true,
  },
  props: {
    page_id: Property.ShortText({
      displayName: 'Page ID',
      description: 'The id of the page to move. Resolve via notion_search.',
      required: true,
    }),
    new_parent_page_id: Property.ShortText({
      displayName: 'New Parent Page ID',
      description:
        'Move the page under this page. Supply exactly one of New Parent Page ID or New Parent Database ID.',
      required: false,
    }),
    new_parent_database_id: Property.ShortText({
      displayName: 'New Parent Database ID',
      description:
        'Move the page into this database as a row. Supply exactly one of New Parent Page ID or New Parent Database ID. The page properties must match the database schema.',
      required: false,
    }),
  },
  async run(context) {
    const { page_id, new_parent_page_id, new_parent_database_id } =
      context.propsValue;

    if (!page_id) {
      throw new Error('Page ID is required');
    }
    if (
      (!new_parent_page_id && !new_parent_database_id) ||
      (new_parent_page_id && new_parent_database_id)
    ) {
      throw new Error(
        'Supply exactly one of New Parent Page ID or New Parent Database ID.'
      );
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const parent: any = new_parent_database_id
      ? { database_id: new_parent_database_id }
      : { page_id: new_parent_page_id };

    try {
      return await notion.pages.update({
        page_id: page_id as string,
        parent,
      } as any);
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Integration lacks required capabilities or the page/parent is not shared with it. Ensure your Notion integration has "Update content" capability and both the page and the target parent are shared with it.'
        );
      }
      throw error;
    }
  },
});
