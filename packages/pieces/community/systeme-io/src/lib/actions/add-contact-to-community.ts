import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon, systemeIoInput } from '../common/client';
import { communityDropdown, contactPicker } from '../common/dropdowns';
import { addToCommunityOutputSchema } from '../output-schemas';

export const addContactToCommunity = createAction({
  auth: systemeIoAuth,
  name: 'add_contact_to_community',
  classification: 'WRITE',
  displayName: 'Add Contact to Community',
  description: 'Give a contact membership of a community',
  audience: 'both',
  aiMetadata: {
    description:
      'Requests membership of a Systeme.io community for a contact. Systeme.io queues the request (HTTP 202), so the membership may take a moment to appear in the community member list. Use to grant community access after a purchase or signup. Not idempotent: repeat behaviour is undocumented.',
    idempotent: false,
  },
  props: {
    community_id: communityDropdown,
    contact_id: contactPicker({ required: true }),
  },
  outputSchema: addToCommunityOutputSchema,
  async run(context) {
    const communityId = systemeIoInput.requireId({ value: context.propsValue.community_id, name: 'Community' });
    const contactId = systemeIoInput.requireId({ value: context.propsValue.contact_id, name: 'Contact' });
    await systemeIoCommon.apiCall({
      method: HttpMethod.POST,
      url: `/community/communities/${communityId}/memberships`,
      auth: context.auth.secret_text,
      body: { contactId },
    });
    return { queued: true, community_id: communityId, contact_id: contactId };
  },
});
