import { createAction } from '@activepieces/pieces-framework';
import { bitlyAuth } from '../../common/auth';
import { brandedDomains, getBitlyGroups } from '../../common/props';
import { groupsOutputSchema } from '../../common/schemas';

export const aiListGroupsAction = createAction({
  auth: bitlyAuth,
  name: 'ai_list_groups',
  classification: 'READ',
  displayName: 'List Groups',
  description: 'List the Bitly groups the connected account can use.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every Bitly group of the connected account with its GUID, name, organization GUID and branded domains. Use it to find the Group GUID needed by Search Bitlinks, List QR Codes and Create QR Code. Read-only.',
    idempotent: true,
  },
  outputSchema: groupsOutputSchema,
  props: {},
  async run(context) {
    const groups = await getBitlyGroups({ accessToken: context.auth.props.accessToken });
    return {
      groups: groups.map((group) => ({
        guid: group.guid,
        name: group.name,
        organization_guid: group.organization_guid ?? null,
        is_active: group.is_active ?? null,
        role: group.role ?? null,
        bsds: brandedDomains(group.bsds),
      })),
    };
  },
});
