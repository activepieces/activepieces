import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const updatePostAction = createAction({
  auth: discourseAuth,
  name: 'update_post',
  classification: 'WRITE',
  displayName: 'Update Post',
  description: 'Replaces the content of a Discourse post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replace the full Markdown content of a Discourse post by numeric post ID, with an optional edit reason shown in the revision history. To change a topic title or category use Update Topic. Sets the content to the given text, so retries leave the same result.',
    idempotent: true,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Numeric post ID.', required: true }),
    raw: Property.LongText({ displayName: 'New Content', description: 'Full new Markdown content.', required: true }),
    edit_reason: Property.ShortText({ displayName: 'Edit Reason', required: false }),
  },
  outputSchema: discourseSchemas.post,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.post_id, label: 'Post ID' });
    const raw = discourseInput.markdown({ value: propsValue.raw, label: 'New Content' });
    const editReason = discourseInput.optionalText(propsValue.edit_reason);
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.PUT,
        path: `/posts/${id}.json`,
        body: { post: { raw, ...(editReason === undefined ? {} : { edit_reason: editReason }) } },
      }),
    );
    return discourseMap.post({ raw: body['post'] ?? body, baseUrl: discourseOps.baseUrl(auth.props) });
  },
});
