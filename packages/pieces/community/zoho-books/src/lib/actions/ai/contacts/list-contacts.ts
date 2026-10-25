import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

const FILTER_BY = [
  'Status.All',
  'Status.Active',
  'Status.Inactive',
  'Status.Duplicate',
  'Status.PortalEnabled',
  'Status.PortalDisabled',
  'Status.CreditLimitExceed',
  'Status.Crm',
  'Invoice.OverDue',
  'Invoice.Unpaid',
];

const SORT_COLUMNS = [
  'contact_name',
  'first_name',
  'last_name',
  'email',
  'outstanding_receivable_amount',
  'created_time',
  'last_modified_time',
];

export const listContactsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_contacts',
  displayName: 'List Contacts',
  description: 'Lists Zoho Books contacts (customers and vendors), with filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists customers and vendors with their contact_id, filtered by type, name, email, phone, status or free text. Returns one page; page_context.has_more_page tells whether to fetch the next page.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactType: Property.StaticDropdown({
      displayName: 'Contact Type',
      required: false,
      options: {
        options: [
          { label: 'Customer', value: 'customer' },
          { label: 'Vendor', value: 'vendor' },
        ],
      },
    }),
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Exact contact name.',
      required: false,
    }),
    contactNameContains: Property.ShortText({
      displayName: 'Contact Name Contains',
      description: 'Part of the contact name.',
      required: false,
    }),
    companyName: Property.ShortText({ displayName: 'Company Name', required: false }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the primary contact person.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone of the primary contact person.',
      required: false,
    }),
    searchText: Property.ShortText({
      displayName: 'Search Text',
      description: 'Searches contact names and notes.',
      required: false,
    }),
    filterBy: Property.StaticDropdown({
      displayName: 'Filter By',
      description: 'Status filter. Defaults to Status.All.',
      required: false,
      options: { options: FILTER_BY.map((value) => ({ label: value, value })) },
    }),
    sortColumn: Property.StaticDropdown({
      displayName: 'Sort Column',
      required: false,
      options: { options: SORT_COLUMNS.map((value) => ({ label: value, value })) },
    }),
    page: zohoBooksAiProps.page(),
    perPage: zohoBooksAiProps.perPage(),
  },
  async run(context) {
    const {
      contactType,
      contactName,
      contactNameContains,
      companyName,
      email,
      phone,
      searchText,
      filterBy,
      sortColumn,
      page,
      perPage,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/contacts',
      query: {
        organization_id: organizationId,
        contact_type: contactType,
        contact_name: contactName,
        contact_name_contains: contactNameContains,
        company_name: companyName,
        email,
        phone,
        search_text: searchText,
        filter_by: filterBy,
        sort_column: sortColumn,
        ...zohoBooksUtils.pageQuery({ page, perPage }),
      },
    });
  },
});
