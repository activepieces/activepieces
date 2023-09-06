import { createAction } from '@activepieces/pieces-framework';
import { notionAuth } from '../..';
import { notionCommon } from '../common';
export const createDatabaseItem = createAction({
  auth: notionAuth,
  name: 'create_database_item',
  displayName: 'Create Database Item',
  description: 'desc',
  props: {
    database_id: notionCommon.database_id,
    databaseFields: notionCommon.databaseFields(),
  },
  async run(context) {},
});
