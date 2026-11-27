import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const removeAllowedCollaborationDomainAction = createAction({
  auth: boxAuth,
  name: 'box_remove_allowed_collaboration_domain',
  displayName: 'Remove Allowed Collaboration Domain',
  description: 'Removes a domain from the Box enterprise\'s allowed collaboration domains.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes an allowed collaboration domain entry, so new collaborations with that domain are blocked while restrictions are on; add it back with Add Allowed Collaboration Domain. Needs admin rights. Get the entry ID from List Allowed Collaboration Domains.',
    idempotent: false,
  },
  props: {
    entryId: boxAiProps.allowedDomainEntryId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/collaboration_whitelist_entries/${encodeURIComponent(propsValue.entryId)}`,
    });
    return { deleted: true, entryId: propsValue.entryId };
  },
});
