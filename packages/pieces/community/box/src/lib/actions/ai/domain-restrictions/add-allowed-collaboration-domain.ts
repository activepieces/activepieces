import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

const DIRECTIONS = ['inbound', 'outbound', 'both'];

export const addAllowedCollaborationDomainAction = createAction({
  auth: boxAuth,
  name: 'box_add_allowed_collaboration_domain',
  displayName: 'Add Allowed Collaboration Domain',
  description: 'Adds a domain to the Box enterprise\'s allowed collaboration domains.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Allows collaboration with a domain when the enterprise restricts collaboration domains, and returns the entry ID. Needs admin rights. Remove it with Remove Allowed Collaboration Domain.',
    idempotent: false,
  },
  props: {
    domain: Property.ShortText({ displayName: 'Domain', description: 'Domain to allow, e.g. "example.com".', required: true }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: '"inbound" (their users into our content), "outbound" (our users into theirs) or "both".',
      required: true,
      options: { options: DIRECTIONS.map((value) => ({ label: value, value })) },
    }),
  },
  async run({ auth, propsValue }) {
    if (!DIRECTIONS.includes(propsValue.direction)) {
      throw new Error(`Direction must be one of: ${DIRECTIONS.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/collaboration_whitelist_entries',
      body: { domain: propsValue.domain, direction: propsValue.direction },
    });
  },
});
