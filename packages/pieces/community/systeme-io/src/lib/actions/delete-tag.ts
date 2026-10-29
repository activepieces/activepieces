import { createAction } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoInput } from '../common/client';
import { tagPicker } from '../common/dropdowns';
import { deleteResultOutputSchema } from '../output-schemas';
import { systemeOps } from '../common/operations';

export const deleteTag = createAction({
  auth: systemeIoAuth,
  name: 'delete_tag',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Tag',
  description: 'Permanently delete a tag. It is removed from every contact that has it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a Systeme.io tag by id, which also removes it from every contact that has it and can break automations that use the tag. Use only when the tag itself should no longer exist; to untag one contact use Remove Tag from Contact. Idempotent: an already-deleted id returns not_found instead of failing.',
    idempotent: true,
  },
  props: {
    tag_id: tagPicker({ required: true }),
  },
  outputSchema: deleteResultOutputSchema,
  async run(context) {
    const id = systemeIoInput.requireId({ value: context.propsValue.tag_id, name: 'Tag' });
    return systemeOps.deleteById({ apiKey: context.auth.secret_text, url: `/tags/${id}`, id });
  },
});
