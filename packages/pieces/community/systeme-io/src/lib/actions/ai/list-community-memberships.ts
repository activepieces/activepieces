import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../../common/auth';
import { systemeIoInput } from '../../common/client';
import { membershipRow } from '../../common/mappers';
import { aiListMembershipsOutputSchema } from '../../output-schemas-ai';
import { aiCommon } from './common';

export const systemeListCommunityMemberships = createAction({
  auth: systemeIoAuth,
  name: 'systeme_list_community_memberships',
  classification: 'SEARCH',
  displayName: 'List Community Memberships',
  description: 'List community memberships, filtered by community and/or contact',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Systeme.io community memberships (membership id, community and contact id), optionally filtered by community_id and/or contact_id. Use to check whether a contact is already a member; a membership added with add_contact_to_community can take a moment to appear. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    community_id: Property.ShortText({
      displayName: 'Community ID',
      description: 'Optional numeric community id (from systeme_list_communities).',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Optional numeric contact id.',
      required: false,
    }),
    max_results: aiCommon.maxResultsProp,
    starting_after: aiCommon.startingAfterProp,
  },
  outputSchema: aiListMembershipsOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const community = systemeIoInput.optionalId({ value: p.community_id, name: 'community_id' });
    const contact = systemeIoInput.optionalId({ value: p.contact_id, name: 'contact_id' });
    const result = await aiCommon.list({
      apiKey: context.auth.secret_text,
      url: '/community/memberships',
      query: { community, contact },
      maxResults: p.max_results,
      startingAfter: p.starting_after,
      map: membershipRow,
    });
    return { memberships: result.items, count: result.count, has_more: result.has_more, next_cursor: result.next_cursor };
  },
});
