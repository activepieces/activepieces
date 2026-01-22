import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroFindContact = createAction({
  auth: xeroAuth,
  name: 'xero_find_contact',
  displayName: 'Find Contact',
  description: 'Finds a contact by name or account number (or SearchTerm).',
  props: {
    tenant_id: props.tenant_id,
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      options: {
        options: [
          { label: 'Name (exact match)', value: 'NAME' },
          { label: 'Account Number (exact match)', value: 'ACCOUNT_NUMBER' },
          { label: 'Search Term (broad search)', value: 'SEARCH_TERM' },
        ],
      },
      defaultValue: 'NAME',
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Name, Account Number, or Search Term depending on Search By.',
      required: true,
    }),
    include_archived: Property.Checkbox({
      displayName: 'Include Archived',
      required: false,
      defaultValue: false,
    }),
    summary_only: Property.Checkbox({
      displayName: 'Summary Only (faster, lighter)',
      description: 'Recommended for broad searches (Search Term). Excludes heavy fields.',
      required: false,
      defaultValue: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Pagination page (optional).',
      required: false,
    }),
  },
  async run(context) {
    const {
      tenant_id,
      search_by,
      value,
      include_archived,
      summary_only,
      page,
    } = context.propsValue as any;

    const baseUrl = 'https://api.xero.com/api.xro/2.0/Contacts';

    const params: string[] = [];
    if (include_archived) params.push('includeArchived=true');
    if (summary_only) params.push('summaryOnly=true');
    if (page) params.push(`page=${encodeURIComponent(page)}`);

    if (search_by === 'SEARCH_TERM') {
      params.push(`SearchTerm=${encodeURIComponent(value)}`);
    } else if (search_by === 'NAME') {
      const where = `Name="${value.replace(/"/g, '\\"')}"`;
      params.push(`where=${encodeURIComponent(where)}`);
    } else if (search_by === 'ACCOUNT_NUMBER') {
      const where = `AccountNumber="${value.replace(/"/g, '\\"')}"`;
      params.push(`where=${encodeURIComponent(where)}`);
    }

    const url = params.length ? `${baseUrl}?${params.join('&')}` : baseUrl;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
      },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});


