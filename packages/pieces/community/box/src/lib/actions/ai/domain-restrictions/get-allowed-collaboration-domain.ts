import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getAllowedCollaborationDomainAction = createAction({
  auth: boxAuth,
  name: 'box_get_allowed_collaboration_domain',
  displayName: 'Get Allowed Collaboration Domain',
  description: 'Gets an allowed collaboration domain entry by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one allowed collaboration domain entry with its domain and direction. Needs admin rights. Get the ID from List Allowed Collaboration Domains or Add Allowed Collaboration Domain.',
    idempotent: true,
  },
  props: {
    entryId: boxAiProps.allowedDomainEntryId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/collaboration_whitelist_entries/${encodeURIComponent(propsValue.entryId)}`,
    });
  },
});
