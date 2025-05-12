import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const addLeadToCampaignAction = createAction({
  auth: instantlyAiAuth,
  name: 'add_lead_to_campaign',
  displayName: 'Add Lead to Campaign',
  description: 'Add a specific lead to a campaign or lead list in Instantly',
  props: {
    campaign_id: Property.Dropdown({
      displayName: 'Campaign',
      description: 'Select the campaign to add the lead to',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await makeRequest({
            endpoint: 'campaigns',
            method: HttpMethod.GET,
            apiKey: auth as string,
            queryParams: {
              limit: 100,
            },
          });

          if (!response || !response.items || !Array.isArray(response.items)) {
            return {
              disabled: true,
              placeholder: 'No campaigns found',
              options: [],
            };
          }

          return {
            options: response.items.map((campaign: any) => {
              return {
                label: campaign.name,
                value: campaign.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error fetching campaigns',
            options: [],
          };
        }
      },
    }),
    list_id: Property.Dropdown({
      displayName: 'Lead List',
      description: 'Select the lead list to add the lead to',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await makeRequest({
            endpoint: 'lead-lists',
            method: HttpMethod.GET,
            apiKey: auth as string,
          });

          if (!response || !response.items || !Array.isArray(response.items)) {
            return {
              disabled: true,
              placeholder: 'No lead lists found',
              options: [],
            };
          }

          return {
            options: response.items.map((list: any) => {
              return {
                label: list.name,
                value: list.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error fetching lead lists',
            options: [],
          };
        }
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the lead',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the lead',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the lead',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name of the lead',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the lead',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Website of the lead',
      required: false,
    }),
    personalization: Property.LongText({
      displayName: 'Personalization',
      description: 'Personalization text for the lead',
      required: false,
    }),
    custom_attributes: Property.Object({
      displayName: 'Custom Attributes',
      description: 'Additional custom attributes for the lead',
      required: false,
    }),
  },
  async run(context) {
    const {
      campaign_id,
      list_id,
      email,
      first_name,
      last_name,
      company_name,
      phone,
      website,
      personalization,
      custom_attributes,
    } = context.propsValue;
    const { auth: apiKey } = context;

    if (!campaign_id && !list_id) {
      throw new Error('Either Campaign ID or List ID must be provided');
    }

    const leadPayload: Record<string, unknown> = {
      email,
    };

    if (first_name) {
      leadPayload['first_name'] = first_name;
    }

    if (last_name) {
      leadPayload['last_name'] = last_name;
    }

    if (company_name) {
      leadPayload['company_name'] = company_name;
    }

    if (phone) {
      leadPayload['phone'] = phone;
    }

    if (website) {
      leadPayload['website'] = website;
    }

    if (personalization) {
      leadPayload['personalization'] = personalization;
    }

    if (custom_attributes) {
      leadPayload['payload'] = custom_attributes;
    }

    if (campaign_id) {
      leadPayload['campaign'] = campaign_id;
    } else if (list_id) {
      leadPayload['list_id'] = list_id;
    }

    return await makeRequest({
      endpoint: 'leads',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: leadPayload,
    });
  },
});
