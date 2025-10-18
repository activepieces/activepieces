import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Lead } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../../index';

export const findLeadAction = createAction({
  auth: zendeskSellAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Find a lead by field(s)',
  props: {
    leadId: Property.Number({
      displayName: 'Lead ID',
      description: 'Specific lead ID to retrieve',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by email address',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Search by first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Search by last name',
      required: false,
    }),
    organizationName: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Search by organization',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Filter by lead status (e.g., New, Contacted, Qualified, Unqualified)',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'Filter by lead owner',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Search by phone number',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Search by mobile number',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Filter by tags (comma-separated)',
      required: false,
    }),
    sourceId: Property.Number({
      displayName: 'Source ID',
      description: 'Filter by lead source',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort results by field',
      required: false,
      options: {
        options: [
          { label: 'Created Date (Newest)', value: 'created_at:desc' },
          { label: 'Created Date (Oldest)', value: 'created_at:asc' },
          { label: 'Updated Date (Newest)', value: 'updated_at:desc' },
          { label: 'Updated Date (Oldest)', value: 'updated_at:asc' },
          { label: 'Name (A-Z)', value: 'last_name:asc' },
          { label: 'Name (Z-A)', value: 'last_name:desc' },
        ],
      },
      defaultValue: 'created_at:desc',
    }),
    perPage: Property.Number({
      displayName: 'Results Per Page',
      description: 'Maximum number of results to return (1-100)',
      required: false,
      defaultValue: 25,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination (starts at 1)',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    if (context.propsValue.leadId) {
      try {
        const response = await makeZendeskSellRequest<{ data: Lead }>(
          context.auth,
          HttpMethod.GET,
          `/leads/${context.propsValue.leadId}`
        );

        return {
          success: true,
          lead: response.data,
          count: 1,
          total: 1,
          page: 1,
          per_page: 1,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Lead not found',
          count: 0,
        };
      }
    }
    const params = new URLSearchParams();
    
    if (context.propsValue.email) {
      params.append('email', context.propsValue.email);
    }
    if (context.propsValue.firstName) {
      params.append('first_name', context.propsValue.firstName);
    }
    if (context.propsValue.lastName) {
      params.append('last_name', context.propsValue.lastName);
    }
    if (context.propsValue.organizationName) {
      params.append('organization_name', context.propsValue.organizationName);
    }
    if (context.propsValue.status) {
      params.append('status', context.propsValue.status);
    }
    if (context.propsValue.ownerId) {
      params.append('owner_id', context.propsValue.ownerId.toString());
    }
    if (context.propsValue.phone) {
      params.append('phone', context.propsValue.phone);
    }
    if (context.propsValue.mobile) {
      params.append('mobile', context.propsValue.mobile);
    }
    if (context.propsValue.sourceId) {
      params.append('source_id', context.propsValue.sourceId.toString());
    }
    
    if (context.propsValue.sortBy) {
      params.append('sort_by', context.propsValue.sortBy);
    }
    const perPage = Math.min(Math.max(context.propsValue.perPage || 25, 1), 100);
    const page = Math.max(context.propsValue.page || 1, 1);
    params.append('per_page', perPage.toString());
    params.append('page', page.toString());

    try {
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await makeZendeskSellRequest<{ 
        items: Lead[];
        meta: {
          count: number;
          links: {
            next_page?: string;
            prev_page?: string;
          };
        };
      }>(
        context.auth,
        HttpMethod.GET,
        `/leads${queryString}`
      );

      return {
        success: true,
        leads: response.items,
        count: response.items.length,
        total: response.meta?.count || response.items.length,
        page: page,
        per_page: perPage,
        has_more: !!response.meta?.links?.next_page,
        metadata: {
          next_page: response.meta?.links?.next_page,
          prev_page: response.meta?.links?.prev_page,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search leads',
        count: 0,
        leads: [],
      };
    }
  },
});