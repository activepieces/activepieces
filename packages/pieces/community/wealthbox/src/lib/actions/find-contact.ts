import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchContacts, fetchTags, WEALTHBOX_API_BASE, handleApiError } from '../common';

export const findContact = createAction({
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Locate a contact by name, email, phone, or advanced filters. Comprehensive contact search with dynamic filtering options.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Search by name (supports partial matches across prefix, first, middle, last, suffix, nickname, and full name for households/companies)',
      required: false
    }),

    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Search by email address',
      required: false
    }),

    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Search by phone number (delimiters like -, (), will be stripped automatically)',
      required: false
    }),

    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'Search by specific contact ID (most precise search)',
      required: false
    }),
    
    external_unique_id: Property.ShortText({
      displayName: 'External Unique ID',
      description: 'Search by external unique identifier',
      required: false
    }),

    contact_type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Filter by contact type',
      required: false,
      options: {
        options: [
          { label: 'Client', value: 'Client' },
          { label: 'Past Client', value: 'Past Client' },
          { label: 'Prospect', value: 'Prospect' },
          { label: 'Vendor', value: 'Vendor' },
          { label: 'Organization', value: 'Organization' }
        ]
      }
    }),

    type: Property.StaticDropdown({
      displayName: 'Contact Entity Type',
      description: 'Filter by entity type',
      required: false,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Household', value: 'household' },
          { label: 'Organization', value: 'organization' },
          { label: 'Trust', value: 'trust' }
        ]
      }
    }),

    household_title: Property.StaticDropdown({
      displayName: 'Household Title',
      description: 'Filter by household title (only applies to household members)',
      required: false,
      options: {
        options: [
          { label: 'Head', value: 'Head' },
          { label: 'Spouse', value: 'Spouse' },
          { label: 'Partner', value: 'Partner' },
          { label: 'Child', value: 'Child' },
          { label: 'Grandchild', value: 'Grandchild' },
          { label: 'Parent', value: 'Parent' },
          { label: 'Grandparent', value: 'Grandparent' },
          { label: 'Sibling', value: 'Sibling' },
          { label: 'Other', value: 'Other' },
          { label: 'Dependent', value: 'Dependent' }
        ]
      }
    }),

    tags_filter: Property.MultiSelectDropdown({
      displayName: 'Tags Filter',
      description: 'Filter contacts by tags',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your Wealthbox account first'
          };
        }

        try {
          const availableTags = await fetchTags(auth as unknown as string, 'Contact');
          const tagOptions = availableTags.map((tag: any) => ({
            label: tag.name,
            value: tag.name
          }));

          return {
            disabled: false,
            options: tagOptions,
            placeholder: tagOptions.length === 0 ? 'No tags available' : 'Select tags to filter by'
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            disabled: true,
            options: [],
            placeholder: `Error loading tags: ${errorMessage}`
          };
        }
      }
    }),

    active: Property.StaticDropdown({
      displayName: 'Active Status',
      description: 'Filter by active status',
      required: false,
      options: {
        options: [
          { label: 'Active Only', value: 'true' },
          { label: 'Inactive Only', value: 'false' },
          { label: 'All Contacts', value: '' }
        ]
      }
    }),

    include_deleted: Property.Checkbox({
      displayName: 'Include Deleted Contacts',
      description: 'Include contacts that have been deleted',
      required: false,
      defaultValue: false
    }),

    updated_since: Property.DateTime({
      displayName: 'Updated Since',
      description: 'Only return contacts updated on or after this date/time',
      required: false
    }),
    
    updated_before: Property.DateTime({
      displayName: 'Updated Before',
      description: 'Only return contacts updated on or before this date/time',
      required: false
    }),
    
    order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'How to order the results',
      required: false,
      options: {
        options: [
          { label: 'Recent (newest first)', value: 'recent' },
          { label: 'Created Date (newest first)', value: 'created' },
          { label: 'Updated Date (newest first)', value: 'updated' },
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' }
        ]
      }
    }),

    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of contacts to return (default: 50, max: 1000)',
      required: false,
      defaultValue: 50
    }),

    return_single_result: Property.Checkbox({
      displayName: 'Return Single Result Only',
      description: 'If checked, returns only the first matching contact. If unchecked, returns all matching contacts.',
      required: false,
      defaultValue: false
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    

    
    const searchParams = new URLSearchParams();
    
    const hasSearchCriteria =
      propsValue.contact_id ||
      propsValue.name ||
      propsValue.email ||
      propsValue.phone ||
      propsValue.external_unique_id ||
      propsValue.contact_type ||
      propsValue.type ||
      propsValue.household_title ||
      (propsValue as any).tags?.tags_filter ||
      propsValue.active ||
      propsValue.include_deleted ||
      propsValue.updated_since ||
      propsValue.updated_before;

    if (!hasSearchCriteria) {
      throw new Error('At least one search criteria must be provided (ID, name, email, phone, external ID, or filters)');
    }

    if (propsValue.contact_id && !(propsValue.name || propsValue.email || propsValue.phone || propsValue.external_unique_id || propsValue.contact_type || propsValue.type || propsValue.household_title || (propsValue as any).tags?.tags_filter || propsValue.active || propsValue.include_deleted || propsValue.updated_since || propsValue.updated_before)) {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${WEALTHBOX_API_BASE}/contacts/${propsValue.contact_id}`,
          headers: {
            'ACCESS_TOKEN': auth as unknown as string,
            'Accept': 'application/json'
          }
        });

        if (response.status >= 400) {
          handleApiError('find contact by ID', response.status, response.body);
        }

        return {
          found: true,
          contact: response.body,
          contacts: [response.body],
          total_results: 1,
          search_criteria: { contact_id: propsValue.contact_id }
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return {
            found: false,
            contact: null,
            contacts: [],
            total_results: 0,
            message: `No contact found with ID: ${propsValue.contact_id}`,
            search_criteria: { contact_id: propsValue.contact_id }
          };
        }
        throw error;
      }
    }
    
    if (propsValue.name) searchParams.append('name', propsValue.name);
    if (propsValue.email) searchParams.append('email', propsValue.email);
    if (propsValue.phone) searchParams.append('phone', propsValue.phone);
    if (propsValue.contact_id) searchParams.append('id', propsValue.contact_id.toString());
    if (propsValue.external_unique_id) searchParams.append('external_unique_id', propsValue.external_unique_id);

    if (propsValue.contact_type) searchParams.append('contact_type', propsValue.contact_type);
    if (propsValue.type) searchParams.append('type', propsValue.type);
    if (propsValue.household_title) searchParams.append('household_title', propsValue.household_title);

    const tagsFilter = propsValue.tags_filter;
    if (tagsFilter && Array.isArray(tagsFilter) && tagsFilter.length > 0) {
      tagsFilter.forEach((tag: string) => {
        searchParams.append('tags[]', tag);
      });
    }

    if (propsValue.active && propsValue.active !== '') {
      searchParams.append('active', propsValue.active);
    }
    if (propsValue.include_deleted) {
      searchParams.append('deleted', 'true');
    }

    if (propsValue.updated_since) searchParams.append('updated_since', propsValue.updated_since);
    if (propsValue.updated_before) searchParams.append('updated_before', propsValue.updated_before);

    if (propsValue.order) searchParams.append('order', propsValue.order);

    const limit = Math.min(propsValue.limit || 50, 1000);
    searchParams.append('limit', limit.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `${WEALTHBOX_API_BASE}/contacts?${queryString}` : `${WEALTHBOX_API_BASE}/contacts`;
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Accept': 'application/json'
        }
      });
      
      if (response.status >= 400) {
        handleApiError('find contacts', response.status, response.body);
      }

      const contacts = response.body.contacts || [];
      const totalResults = contacts.length;

      if (propsValue.return_single_result || totalResults === 1) {
        return {
          found: totalResults > 0,
          contact: totalResults > 0 ? contacts[0] : null,
          contacts: contacts,
          total_results: totalResults,
          search_criteria: Object.fromEntries(searchParams),
          message: totalResults === 0 ? 'No contacts found matching the search criteria' : undefined
        };
      }

      return {
        found: totalResults > 0,
        contacts: contacts,
        total_results: totalResults,
        search_criteria: Object.fromEntries(searchParams),
        message: totalResults === 0 ? 'No contacts found matching the search criteria' : undefined
      };
      
    } catch (error) {
      throw new Error(`Failed to find contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});