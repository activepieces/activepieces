import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { pageEditOutputSchema } from '../output-schemas';

export const trashPageAction = createAction({
  auth: wordpressAuth,
  name: 'trash_page',
  classification: 'DESTRUCTIVE',
  displayName: 'Move Page to Trash',
  description: 'Moves a page to the trash, where it can still be restored.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a WordPress static page to the trash; it can be restored from the WordPress admin until the trash is emptied. Child pages are not trashed. Calling it on a page that is already trashed returns the page unchanged, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: pageEditOutputSchema,
  props: {
    page_id: Property.Number({
      displayName: 'Page ID',
      description: 'ID of the page to trash, from list_pages.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.page_id, propName: 'Page ID' });
    return wordpressApi.trashItem({ auth, collection: 'pages', id });
  },
});
