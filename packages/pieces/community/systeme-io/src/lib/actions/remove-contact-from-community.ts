import { createAction } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoInput } from '../common/client';
import { communityDropdown, contactPicker } from '../common/dropdowns';
import { systemeOps } from '../common/operations';
import { removalResultOutputSchema } from '../output-schemas';

export const removeContactFromCommunity = createAction({
  auth: systemeIoAuth,
  name: 'remove_contact_from_community',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Contact from Community',
  description: "Remove a contact's membership of a community",
  audience: 'both',
  aiMetadata: {
    description:
      "Removes a Systeme.io contact from a community by deleting their membership; the contact and community stay. Use to revoke community access after a refund or cancellation. Idempotent: if the contact is not a member it returns not_found=true and changes nothing.",
    idempotent: true,
  },
  props: {
    community_id: communityDropdown,
    contact_id: contactPicker({ required: true }),
  },
  outputSchema: removalResultOutputSchema,
  async run(context) {
    const communityId = systemeIoInput.requireId({ value: context.propsValue.community_id, name: 'Community' });
    const contactId = systemeIoInput.requireId({ value: context.propsValue.contact_id, name: 'Contact' });
    return systemeOps.removeMatching<Membership>({
      apiKey: context.auth.secret_text,
      listUrl: '/community/memberships',
      query: { community: communityId, contact: contactId },
      matches: (row) => Number(row.community?.id) === communityId && Number(row.contact?.id) === contactId,
      deleteUrl: (id) => `/community/memberships/${id}`,
    });
  },
});

type Membership = { id?: unknown; community?: { id?: unknown }; contact?: { id?: unknown } };
