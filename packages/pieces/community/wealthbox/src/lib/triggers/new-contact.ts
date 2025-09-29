import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod
} from '@activepieces/pieces-common';
import {
  pollingHelper,
  DedupeStrategy,
  Polling
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { fetchUsers, fetchTags, WEALTHBOX_API_BASE, handleApiError } from '../common';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    if (!auth) {
      throw new Error('Authentication is required');
    }

    const searchParams = new URLSearchParams();

    searchParams.append('limit', '100');

    if (propsValue.contact_type) searchParams.append('contact_type', propsValue.contact_type);
    if (propsValue.type) searchParams.append('type', propsValue.type);
    if (propsValue.household_title) searchParams.append('household_title', propsValue.household_title);
    if (propsValue.assigned_to) searchParams.append('assigned_to', propsValue.assigned_to);

    const tagsFilter = propsValue.tags_filter;
    if (tagsFilter && Array.isArray(tagsFilter) && tagsFilter.length > 0) {
      tagsFilter.forEach((tag: string) => {
        searchParams.append('tags[]', tag);
      });
    }

    if (propsValue.active !== undefined && propsValue.active !== '') {
      searchParams.append('active', propsValue.active);
    }
    if (propsValue.include_deleted) {
      searchParams.append('deleted', 'true');
    }

    if (lastFetchEpochMS) {
      const lastFetchDate = dayjs(lastFetchEpochMS - 1000).toISOString();
      searchParams.append('updated_since', lastFetchDate);
    }

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
        handleApiError('poll new contacts', response.status, response.body);
      }

      const contacts = response.body.contacts || [];

      const newContacts = contacts.filter((contact: any) => {
        if (!lastFetchEpochMS) return true;

        const contactCreatedAt = dayjs(contact.created_at).valueOf();
        return contactCreatedAt > lastFetchEpochMS;
      });

      return newContacts.map((contact: any) => ({
        epochMilliSeconds: dayjs(contact.created_at).valueOf(),
        data: contact
      }));
    } catch (error) {
      throw new Error(`Failed to poll new contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created',
  type: TriggerStrategy.POLLING,
  props: {
    contact_type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Only trigger for contacts of this type (optional)',
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
      displayName: 'Entity Type',
      description: 'Only trigger for contacts of this entity type (optional)',
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
      description: 'Only trigger for contacts with this household title (optional)',
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

    assigned_to: Property.Dropdown({
      displayName: 'Assigned To',
      description: 'Only trigger for contacts assigned to this user (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const users = await fetchUsers(auth as unknown as string);
          return {
            options: users.map((user: any) => ({
              label: `${user.name} (${user.email})`,
              value: user.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load users. Please check your authentication.'
          };
        }
      }
    }),

    tags_filter: Property.MultiSelectDropdown({
      displayName: 'Tags Filter',
      description: 'Only trigger for contacts with one of these tags (optional)',
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
          { label: 'All Contacts', value: '' },
          { label: 'Active Only', value: 'true' },
          { label: 'Inactive Only', value: 'false' }
        ]
      }
    }),

    include_deleted: Property.Checkbox({
      displayName: 'Include Deleted Contacts',
      description: 'Include contacts that have been deleted',
      required: false,
      defaultValue: false
    })
  },
  sampleData: {
    id: 1,
    creator: 1,
    created_at: '2015-05-24 10:00 AM -0400',
    updated_at: '2015-10-12 11:30 PM -0400',
    prefix: 'Mr.',
    first_name: 'Kevin',
    middle_name: 'James',
    last_name: 'Anderson',
    suffix: 'M.D.',
    nickname: 'Kev',
    job_title: 'CEO',
    twitter_name: 'kev.anderson',
    linkedin_url: 'linkedin.com/in/kanderson',
    background_information: 'Met Kevin at a conference.',
    birth_date: '1975-10-27',
    anniversary: '1998-11-29',
    client_since: '2002-05-21',
    assigned_to: 1,
    referred_by: 1,
    type: 'Person',
    gender: 'Male',
    contact_source: 'Referral',
    contact_type: 'Client',
    status: 'Active',
    marital_status: 'Married',
    important_information: 'Has 3 kids in college',
    personal_interests: 'Skiing: Downhill, Traveling',
    investment_objective: 'Income',
    time_horizon: 'Intermediate',
    risk_tolerance: 'Moderate',
    company_name: 'Acme Co.',
    tags: [
      {
        id: 1,
        name: 'Clients'
      }
    ],
    street_addresses: [
      {
        street_line_1: '155 12th Ave.',
        street_line_2: 'Apt 3B',
        city: 'New York',
        state: 'New York',
        zip_code: '10001',
        country: 'United States',
        principal: true,
        kind: 'Work',
        id: 1,
        address: '155 12th Ave., Apt 3B, New York, New York 10001, United States'
      }
    ],
    email_addresses: [
      {
        id: 1,
        address: 'kevin.anderson@example.com',
        principal: true,
        kind: 'Work'
      }
    ],
    phone_numbers: [
      {
        id: 1,
        address: '(555) 555-5555',
        principal: true,
        extension: '77',
        kind: 'Work'
      }
    ]
  },

  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },

  test: async (context) => {
    return await pollingHelper.test(polling, context);
  }
});