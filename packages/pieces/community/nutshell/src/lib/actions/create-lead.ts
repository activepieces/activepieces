import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall, unwrapFirst } from '../common/client';

export const createLead = createAction({
  auth: nutshellAuth,
  name: 'createLead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in Nutshell.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new lead (deal) in Nutshell with a description, optional value, and optional links to existing accounts, contacts, and tags. Use to record a new sales opportunity. Not idempotent: calling it repeatedly creates duplicate leads.',
    idempotent: false,
  },
  props: {
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A short description of the lead. This is also used as the lead name.',
      required: true,
    }),
    manualValue: Property.ShortText({
      displayName: 'Value',
      description: 'Manual value override for the lead, e.g. "500.00".',
      required: false,
    }),
    accountIds: Property.Array({
      displayName: 'Account IDs',
      description: 'IDs of companies to link to this lead, e.g. "12-accounts".',
      required: false,
    }),
    contactIds: Property.Array({
      displayName: 'Contact IDs',
      description: 'IDs of contacts to link to this lead, e.g. "34-contacts".',
      required: false,
    }),
    ownerId: Property.ShortText({
      displayName: 'Owner User ID',
      description: 'ID of the Nutshell user to assign as the owner of this lead.',
      required: false,
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Key-value pairs matching custom field names configured in Nutshell.',
      required: false,
    }),
  },
  async run(context) {
    const { description, manualValue, accountIds, contactIds, ownerId, tagIds, customFields } =
      context.propsValue;

    const links: Record<string, unknown> = {};
    if (accountIds && accountIds.length > 0) links['accounts'] = accountIds;
    if (contactIds && contactIds.length > 0) links['contacts'] = contactIds;
    if (ownerId) links['owner'] = ownerId;
    if (tagIds && tagIds.length > 0) links['tags'] = tagIds;

    const lead: Record<string, unknown> = { description };
    if (manualValue) lead['manualValue'] = manualValue;
    if (customFields) lead['customFields'] = customFields;
    if (Object.keys(links).length > 0) lead['links'] = links;

    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/leads',
      body: { leads: [lead] },
    });

    return unwrapFirst(response, 'leads');
  },
});
