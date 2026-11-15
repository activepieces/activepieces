import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsDeleted, GravityFormsEntry } from '../../common/types';
import { gravityformsDeleteEntryOutputSchema } from '../../output-schemas';

export const deleteEntryAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_delete_entry',
  outputSchema: gravityformsDeleteEntryOutputSchema,
  displayName: 'Delete Entry',
  description: 'Moves an entry to the trash, or deletes it permanently.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves an entry to the trash by default (status "trash"), which can be restored in WordPress; Delete Permanently "true" removes it for good. Trashing an already trashed entry fails. Entry ids come from List Entries.',
    idempotent: false,
  },
  props: {
    entryId: gravityFormsAiProps.entryId({ required: true }),
    force: gravityFormsAiProps.force({ required: false }),
  },
  async run(context) {
    const { entryId, force } = context.propsValue;
    if (force === 'true') {
      return await gravityFormsClient.request<GravityFormsDeleted<GravityFormsEntry>>({
        auth: context.auth,
        method: HttpMethod.DELETE,
        path: `/entries/${encodeURIComponent(entryId)}`,
        query: { force: '1' },
      });
    }
    const previous = await gravityFormsClient.request<GravityFormsEntry>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/entries/${encodeURIComponent(entryId)}`,
    });
    return { deleted: false, previous };
  },
});
