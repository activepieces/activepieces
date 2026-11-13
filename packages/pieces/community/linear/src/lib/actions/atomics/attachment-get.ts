import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearAttachmentNode, linearMappers } from '../../common/mappers';
import { ATTACHMENT_GET_QUERY } from './queries';
import { atomicAttachmentOutputSchema } from './output-schemas';

export const linearAttachmentGetAtomic = createAction({
  auth: linearAuth,
  name: 'linear_attachment_get',
  classification: 'READ',
  displayName: 'Get Attachment (AI)',
  description: 'Get one issue attachment (link) by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Linear issue attachment by ID: its URL, title, subtitle, source type and the issue it belongs to. Use to inspect a link attached to an issue; to fetch the bytes of a file uploaded into Linear, use Download Linear Upload with the uploads.linear.app URL instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    attachment_id: Property.ShortText({ displayName: 'Attachment ID', description: 'UUID of the attachment.', required: true }),
  },
  outputSchema: atomicAttachmentOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{ attachment: LinearAttachmentNode | null }>({
      auth,
      query: ATTACHMENT_GET_QUERY,
      variables: { id: propsValue.attachment_id.trim() },
    });
    if (!data.attachment) {
      throw new Error(`No Linear attachment found for ${propsValue.attachment_id}.`);
    }
    return linearMappers.flattenAttachment(data.attachment);
  },
});
