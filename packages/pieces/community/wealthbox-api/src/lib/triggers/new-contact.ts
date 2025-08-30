import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import {
  pollingHelper,
  DedupeStrategy,
  Polling
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    if (!auth) {
      throw new Error('Authentication is required');
    }

    const accessToken = (auth as any).access_token;
    if (!accessToken) {
      throw new Error('Access token not found in authentication');
    }

    // Build URL with updated_since parameter for polling
    let url = 'https://api.crmworkspace.com/v1/contacts?per_page=100';

    // Add filter parameters if provided
    if (propsValue.contact_type) {
      url += `&contact_type=${encodeURIComponent(propsValue.contact_type)}`;
    }
    if (propsValue.type) {
      url += `&type=${encodeURIComponent(propsValue.type)}`;
    }
    if (propsValue.active !== undefined) {
      url += `&active=${propsValue.active}`;
    }
    if (propsValue.tags && propsValue.tags.length > 0) {
      propsValue.tags.forEach((tag: string) => {
        url += `&tags[]=${encodeURIComponent(tag)}`;
      });
    }

    // Add updated_since parameter if we have a last fetch timestamp
    if (lastFetchEpochMS) {
      const lastFetchDate = dayjs(lastFetchEpochMS).format(
        'YYYY-MM-DD HH:mm:ss'
      );
      url += `&updated_since=${encodeURIComponent(lastFetchDate)}`;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken
        },
        headers: {
          Accept: 'application/json'
        }
      });

      if (response.status >= 400) {
        throw new Error(
          `Wealthbox API error: ${response.status} - ${JSON.stringify(
            response.body
          )}`
        );
      }

      const contacts = response.body.contacts || [];

      // Filter for newly created contacts (not just updated)
      // We'll use created_at timestamp to identify truly new contacts
      const newContacts = contacts.filter((contact: any) => {
        if (!lastFetchEpochMS) return true; // First run, return all contacts

        const contactCreatedAt = dayjs(contact.created_at).valueOf();
        return contactCreatedAt > lastFetchEpochMS;
      });

      return newContacts.map((contact: any) => ({
        epochMilliSeconds: dayjs(contact.created_at).valueOf(),
        data: contact
      }));
    } catch (error) {
      throw new Error(
        `Failed to fetch contacts: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
};

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created',
  type: TriggerStrategy.POLLING,
  props: {
    // Filter options
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
    active: Property.Checkbox({
      displayName: 'Active Contacts Only',
      description: 'Only trigger for active contacts',
      required: false,
      defaultValue: true
    }),
    tags: Property.Array({
      displayName: 'Tags Filter',
      description: 'Only trigger for contacts with one of these tags (optional)',
      required: false
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