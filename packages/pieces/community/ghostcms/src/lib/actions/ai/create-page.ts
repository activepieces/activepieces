import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostCommon } from '../../common/client';
import { contentProps, ghostContent } from '../../common/content';
import { ghostPageOutputSchema } from '../../output-schemas';

export const ghostCreatePage = createAction({
  auth: ghostAuth,
  name: 'ghost_create_page',
  outputSchema: ghostPageOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Page',
  description: 'Create a static page as a draft, published or scheduled.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a static page (such as About or Contact, not a blog post) from a title and optional HTML. It is saved as a draft unless Status says otherwise; pages are never emailed. Each call creates a new page.',
    idempotent: false,
  },
  props: {
    ...contentProps({ label: 'page', mode: 'create' }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Draft (default), published now, or scheduled for Published At.',
      required: false,
      defaultValue: 'draft',
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
      description: 'Required when Status is Scheduled and must be in the future.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const body = ghostContent.body(props);
    const status = props.status ?? 'draft';
    body['status'] = status;
    if (status === 'scheduled') {
      body['published_at'] = ghostCommon.futureDate(props.published_at, 'Published At');
    } else if (ghostCommon.hasText(props.published_at)) {
      body['published_at'] = props.published_at;
    }
    return ghostContent.create(context.auth, 'pages', body);
  },
});
