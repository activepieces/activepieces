import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOrganizationContactsOutputSchema } from '../../../output-schemas';

export const getOrganizationContactsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_contacts',
  outputSchema: podioGetOrganizationContactsOutputSchema,
  displayName: 'Get Organization Contacts',
  description: 'Lists or searches the contacts of the current user in one organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists or searches the Podio contacts the connected user has in one organization, filtered by field values or type. The org id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    fieldFilters: podioAiProps.json({
      required: false,
      displayName: 'Field Filters',
      description: 'Contact field values to match, keyed by field name, e.g. {"name": "ann"} or {"mail": "ann@example.com"}. Text fields match partially.',
    }),
    contactType: podioAiProps.choice({
      required: false,
      displayName: 'Contact Type',
      description: '"user" for Podio users, "space" for space contacts, "user,space" for both. Defaults to "user".',
      values: ['user', 'space', 'user,space'],
    }),
    excludeSelf: podioAiProps.bool({ required: false, displayName: 'Exclude Self', description: '"true" leaves the connected user out. Defaults to "true".' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of contacts to return. Defaults to 100.' }),
    offset: podioAiProps.offset({ required: false }),
    order: podioAiProps.text({
      required: false,
      displayName: 'Order',
      description: 'Sort order: "name" (default), an interaction order ("assign", "message", "reference", "alert", "overall") or a field name used in Field Filters.',
    }),
    requiredFields: podioAiProps.text({ required: false, displayName: 'Required Fields', description: 'Comma-separated field names the contacts must have, e.g. "mail" or "mail,phone".' }),
    type: podioAiProps.choice({ required: false, displayName: 'Detail Level', description: '"mini" (default) or "full" contact details.', values: ['mini', 'full'] }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/contact/org/${propsValue.orgId}`,
      query: {
        ...fieldFilters({ filters: propsValue.fieldFilters }),
        ...podioUtils.query({
          values: {
            contact_type: propsValue.contactType,
            exclude_self: podioUtils.toBool({ value: propsValue.excludeSelf }),
            limit: propsValue.limit ?? 100,
            offset: propsValue.offset,
            order: propsValue.order,
            required: propsValue.requiredFields,
            type: propsValue.type,
          },
        }),
      },
    });
    return { contacts: body, count: body.length };
  },
});

function fieldFilters({ filters }: { filters: Record<string, unknown> | undefined }): QueryParams {
  return Object.fromEntries(Object.entries(filters ?? {}).map(([key, value]) => [key, String(value)]));
}
