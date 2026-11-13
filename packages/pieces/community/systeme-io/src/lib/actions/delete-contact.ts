import { createAction } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoInput } from '../common/client';
import { systemeOps } from '../common/operations';
import { contactPicker } from '../common/dropdowns';
import { deleteResultOutputSchema } from '../output-schemas';

export const deleteContact = createAction({
  auth: systemeIoAuth,
  name: 'delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Permanently delete a contact. This cannot be undone.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a Systeme.io contact by id, including its tags, course enrollments and history; there is no trash or undo. Use only when the user explicitly asks to delete the contact; to stop emailing someone, remove a tag instead. Idempotent: deleting an already-deleted id returns not_found instead of failing.',
    idempotent: true,
  },
  props: {
    contact_id: contactPicker({ required: true }),
  },
  outputSchema: deleteResultOutputSchema,
  async run(context) {
    const id = systemeIoInput.requireId({ value: context.propsValue.contact_id, name: 'Contact' });
    return systemeOps.deleteById({ apiKey: context.auth.secret_text, url: `/contacts/${id}`, id });
  },
});
