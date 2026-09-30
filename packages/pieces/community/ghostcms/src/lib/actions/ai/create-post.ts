import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostCommon } from '../../common/client';
import { contentProps, ghostContent } from '../../common/content';
import { ghostPostOutputSchema } from '../../output-schemas';

export const ghostCreatePost = createAction({
  auth: ghostAuth,
  name: 'ghost_create_post',
  outputSchema: ghostPostOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Post',
  description: 'Create a post as a draft, published or scheduled.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a post from a title and optional HTML, tags (by name, created if missing) and authors. It is saved as a draft unless Status says otherwise; this never emails subscribers, so use Publish Post with a newsletter to send it. Each call creates a new post.',
    idempotent: false,
  },
  props: {
    ...contentProps({ label: 'post', mode: 'create' }),
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
      description: 'Required when Status is Scheduled and must be in the future. Optional backdate for Published.',
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
    return ghostContent.create(context.auth, 'posts', body);
  },
});
