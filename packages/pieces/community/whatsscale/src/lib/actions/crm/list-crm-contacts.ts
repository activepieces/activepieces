import {
  createAction,
  Property,
  DropdownState,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';

export const listCrmContactsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_list_crm_contacts',
  displayName: 'List CRM Contacts',
  description:
    'Retrieve a paginated list of CRM contacts with optional filters',
  props: {
    tag: Property.Dropdown<string, false, typeof whatsscaleAuth>({
      auth: whatsscaleAuth,
      displayName: 'Filter by Tag',
      description: 'Optional. Filter contacts by tag.',
      required: false,
      refreshers: [],
      options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account',
          };
        }
        try {
          const response = await whatsscaleClient(
            (auth as any).secret_text,
            HttpMethod.GET,
            '/make/crm/tags',
            undefined
          );
          const tags = response.body as { label: string; value: string }[];
          if (!tags || tags.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No tags found',
            };
          }
          return { disabled: false, options: tags };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load tags',
          };
        }
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Optional. Search contacts by name or phone number.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max results to return. Default 50.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number. Default 1.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { tag, limit, page } = context.propsValue;
    const search = context.propsValue['search'] as string | undefined;

    const qp: Record<string, string> = {};
    if (tag) qp['tag'] = tag;
    if (search) qp['search'] = search;
    if (limit != null) qp['limit'] = String(limit);
    if (page != null) qp['page'] = String(page);

    const params = Object.keys(qp).length > 0 ? qp : undefined;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.GET,
      '/api/crm/contacts',
      undefined,
      params
    );
    return response.body;
  },
});
