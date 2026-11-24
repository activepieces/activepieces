import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const addCommentAction = createAction({
  auth: TeableAuth,
  name: 'teable_add_comment',
  classification: 'WRITE',
  displayName: 'Add Comment',
  description: 'Adds a comment to a record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts a plain-text comment on a Teable record, identified by its table and record ID. Each call adds another comment, so a retry duplicates it.',
    idempotent: false,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    record_id: TeableCommon.record_id,
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Plain text. Each line becomes its own paragraph.',
      required: true,
    }),
  },
  propertyGroups: [
    {
      key: 'record',
      display: 'section',
      label: 'Record',
      icon: 'inbox',
      props: ['base_id', 'table_id', 'record_id'],
    },
    {
      key: 'comment',
      display: 'section',
      label: 'Comment',
      icon: 'text',
      props: ['comment'],
    },
  ],
  outputSchema: teableOutputSchemas.addComment,
  async run(context) {
    const { table_id, record_id, comment } = context.propsValue;
    const text = comment.trim();
    if (text.length === 0) {
      throw new Error('Comment must not be empty.');
    }
    const content = text
      .split('\n')
      .map((line) => line.replace(/\r/g, '').trim())
      .filter((line) => line.length > 0)
      .map((line) => ({ type: 'p', children: [{ type: 'span', value: line }] }));
    await teableClient.createComment({
      auth: context.auth,
      tableId: table_id,
      recordId: record_id,
      content,
    });
    return { success: true, recordId: record_id, comment: text };
  },
});
