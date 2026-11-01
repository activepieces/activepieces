import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { contentProps, ghostContent } from '../../common/content';
import { ghostPageOutputSchema } from '../../output-schemas';

export const ghostUpdatePage = createAction({
  auth: ghostAuth,
  name: 'ghost_update_page',
  outputSchema: ghostPageOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Page',
  description: 'Update the content, settings or status of a page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a static page by ID; only the inputs you supply change, and Status can publish, schedule or unpublish it because pages are never emailed. Tags and Authors replace the whole list; an empty Tags list removes every tag, and Authors can never be empty. Clear Fields blanks the excerpt, feature image or SEO fields.',
    idempotent: true,
  },
  props: {
    page_id: ghostProps.id('Page ID', 'The page ID, from List Pages.'),
    ...contentProps({ label: 'page', mode: 'update' }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Change the page status. Scheduled requires a future Published At. Leave empty to keep it.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Scheduled', value: 'scheduled' },
        ],
      },
    }),
    published_at: Property.DateTime({
      displayName: 'Published At',
      description: 'The publish time. Must be in the future when Status is Scheduled.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const id = ghostCommon.id(props.page_id, 'Page ID');
    const body = ghostContent.body(props);
    if (ghostCommon.hasText(props.status)) {
      body['status'] = props.status;
    }
    if (props.status === 'scheduled') {
      body['published_at'] = ghostCommon.futureDate(props.published_at, 'Published At');
    } else if (ghostCommon.hasText(props.published_at)) {
      body['published_at'] = props.published_at;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to change.');
    }
    return ghostContent.edit(context.auth, 'pages', id, body);
  },
});
