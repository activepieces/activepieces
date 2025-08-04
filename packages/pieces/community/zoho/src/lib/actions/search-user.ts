import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const searchUser = createAction({
  auth: zohoAuth,
  name: 'search-user',
  displayName: 'Search User',
  description: 'Locate users by email in Bigin',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the user to search for',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the user to search for (optional)',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role Filter',
      description: 'Filter users by role (optional)',
      required: false,
      options: {
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Manager', value: 'manager' },
          { label: 'Sales Representative', value: 'sales_rep' },
          { label: 'Support Representative', value: 'support_rep' },
          { label: 'User', value: 'user' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Filter users by status (optional)',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
    department: Property.ShortText({
      displayName: 'Department Filter',
      description: 'Filter users by department (optional)',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location Filter',
      description: 'Filter users by location (optional)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
    includeDetails: Property.Checkbox({
      displayName: 'Include Full Details',
      description: 'Include complete user information in results',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      email,
      name,
      role,
      status,
      department,
      location,
      limit,
      includeDetails,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/users/search`;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('email', email);
    
    if (name) {
      queryParams.append('name', name);
    }
    
    if (role) {
      queryParams.append('role', role);
    }
    
    if (status) {
      queryParams.append('status', status);
    }
    
    if (department) {
      queryParams.append('department', department);
    }
    
    if (location) {
      queryParams.append('location', location);
    }
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    if (includeDetails) {
      queryParams.append('include_details', 'true');
    }

    const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search users: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      users: result.data || result,
      total_count: result.total_count || result.length,
      email,
      search_filters: {
        name,
        role,
        status,
        department,
        location,
      },
    };
  },
}); 