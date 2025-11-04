import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { autocallsAuth, baseApiUrl } from '../..';

export const addLead = createAction({
  auth:autocallsAuth,
  name: 'addLead',
  displayName: 'Add lead to a campaign',
  description: "Add lead to an outbound campaign, to be called by an assistant from our platform.",
  props: {
    campaign: Property.Dropdown({
      displayName: 'Campaign',
      description: 'Select a campaign',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: []
          };
        }

        try {
          const res = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: baseApiUrl + 'api/user/campaigns',
            headers: {
              Authorization: "Bearer " + auth,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
          });

          if (res.status !== 200) {
            return {
              disabled: true,
              placeholder: 'Error fetching campaigns',
              options: [],
            };
          } else if (!res.body || res.body.length === 0) {
            return {
              disabled: true,
              placeholder: 'No campaigns found. Create one first.',
              options: [],
            };
          }

          return {
            options: res.body.map((campaign: any) => ({
              value: campaign.id,
              label: campaign.name,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to fetch campaigns',
            options: [],
          };
        }
      }
    }),
    phone_number: Property.ShortText({
      displayName: 'Customer phone number',
      description: 'Enter the phone number of the customer',
      required: true,
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description: 'Variables to pass to the assistant',
      required: true,
      defaultValue: {
        customer_name: 'John',
      }
    }),
    allow_dupplicate: Property.Checkbox({
      displayName: 'Allow duplicates',
      description: 'Allow the same phone number to be added to the campaign more than once',
      required: true,
      defaultValue: false
    }),
    num_secondary_contacts: Property.Number({
      displayName: 'Number of Secondary Contacts',
      description: 'How many secondary contacts do you want to add?',
      required: false,
      defaultValue: 0,
    }),
    secondary_contacts: Property.DynamicProperties({
      displayName: 'Secondary Contacts',
      description: 'Add secondary contacts for this lead. Each contact can have its own phone number and variables.',
      required: false,
      refreshers: ['num_secondary_contacts'],
      props: async ({ num_secondary_contacts }) => {
        const contacts: any = {};
        const numContacts = Number(num_secondary_contacts) || 0;
        
        // Generate fields based on the number specified
        for (let i = 1; i <= numContacts && i <= 10; i++) {
          contacts[`contact_${i}_phone`] = Property.ShortText({
            displayName: `Contact ${i} - Phone Number`,
            description: `Phone number for secondary contact ${i}`,
            required: true,
          });
          
          contacts[`contact_${i}_variables`] = Property.Object({
            displayName: `Contact ${i} - Variables`,
            description: `Variables for secondary contact ${i} as key-value pairs`,
            required: false,
            defaultValue: {
              customer_name: 'John',
            }
          });
        }
        
        return contacts;
      },
    })
  },
  async run(context) {
    if (!context.auth) {
      throw new Error('Authentication is required');
    }

    try {
      const body: any = {
        campaign_id: context.propsValue['campaign'],
        phone_number: context.propsValue['phone_number'],
        variables: context.propsValue['variables'],
        allow_dupplicate: context.propsValue['allow_dupplicate'],
      };

      // Add secondary contacts if provided
      if (context.propsValue['secondary_contacts']) {
        const secondaryContactsData = context.propsValue['secondary_contacts'] as Record<string, any>;
        const numContacts = Number(context.propsValue['num_secondary_contacts']) || 0;
        const secondaryContacts: any[] = [];
        
        // Process the specified number of contacts
        for (let i = 1; i <= numContacts && i <= 10; i++) {
          const phoneNumber = secondaryContactsData[`contact_${i}_phone`];
          const variables = secondaryContactsData[`contact_${i}_variables`];
          
          // Only add contact if phone number is provided
          if (phoneNumber && phoneNumber.trim() !== '') {
            secondaryContacts.push({
              phone_number: phoneNumber,
              variables: variables || {
                customer_name: '',
              }
            });
          }
        }
        
        if (secondaryContacts.length > 0) {
          body.secondary_contacts = secondaryContacts;
        }
      }

      const res = await httpClient.sendRequest<string[]>({
        method: HttpMethod.POST,
        url: baseApiUrl + 'api/user/lead',
        body: body,
        headers: {
          Authorization: "Bearer " + context.auth,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (res.status !== 200) {
        throw new Error(`Failed to add lead: ${res.status}`);
      }

      return res.body;
    } catch (error) {
      throw new Error(`Failed to add lead: ${error}`);
    }
  },
});
