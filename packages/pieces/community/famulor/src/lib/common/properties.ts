import { Property } from '@activepieces/pieces-framework';
import { famulorCommon } from '.';

// Dynamic Properties
const campaignDropdown = () =>
  Property.Dropdown({
    displayName: 'Campaign',
    description: 'Select the campaign',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        const campaigns = await famulorCommon.listCampaigns({ auth: auth as string });
        
        if (!campaigns || campaigns.length === 0) {
          return {
            disabled: true,
            placeholder: 'No campaigns found. Create one first.',
            options: [],
          };
        }

        return {
          options: campaigns.map((campaign: any) => ({
            label: campaign.name,
            value: campaign.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to fetch campaigns',
          options: [],
        };
      }
    },
  });

const phoneNumberProperty = (displayName: string, description: string, required = true) =>
  Property.ShortText({
    displayName,
    description: `${description} (E.164 format: +1234567890)`,
    required,
  });

const variablesProperty = (displayName: string, description: string, required = false) =>
  Property.Object({
    displayName,
    description,
    required,
    defaultValue: {
      customer_name: 'John Doe',
    },
  });

// Action Properties
export const addLead = () => ({
  campaign: campaignDropdown(),
  phone_number: phoneNumberProperty('Customer Phone Number', 'Enter the phone number of the customer'),
  variables: variablesProperty('Variables', 'Variables to pass to the assistant'),
  allow_dupplicate: Property.Checkbox({
    displayName: 'Allow Duplicates',
    description: 'Allow the same phone number to be added to the campaign more than once',
    required: false,
    defaultValue: false,
  }),
  num_secondary_contacts: Property.Number({
    displayName: 'Number of Secondary Contacts',
    description: 'How many secondary contacts do you want to add? (Max: 10)',
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
      const numContacts = Math.min(Number(num_secondary_contacts) || 0, 10);
      
      for (let i = 1; i <= numContacts; i++) {
        contacts[`contact_${i}_phone`] = phoneNumberProperty(
          `Contact ${i} - Phone Number`,
          `Phone number for secondary contact ${i}`
        );
        
        contacts[`contact_${i}_variables`] = variablesProperty(
          `Contact ${i} - Variables`,
          `Variables for secondary contact ${i} as key-value pairs`,
          false
        );
      }
      
      return contacts;
    },
  }),
});

const phoneNumberDropdown = () =>
  Property.Dropdown({
    displayName: 'From Phone Number',
    description: 'Select an SMS-capable phone number to send from',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        const phoneNumbers = await famulorCommon.listPhoneNumbers({ auth: auth as string });
        
        if (!phoneNumbers || phoneNumbers.length === 0) {
          return {
            disabled: true,
            placeholder: 'No phone numbers found. Purchase an SMS-capable phone number first.',
            options: [],
          };
        }

        return {
          options: phoneNumbers.map((phoneNumber: any) => ({
            label: `${phoneNumber.phone_number} (${phoneNumber.country_code})`,
            value: phoneNumber.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to fetch phone numbers',
          options: [],
        };
      }
    },
  });

export const sendSms = () => ({
  from: phoneNumberDropdown(),
  to: phoneNumberProperty('Recipient Phone Number', 'Enter the recipient\'s phone number'),
  bodysuit: Property.LongText({
    displayName: 'Message',
    description: 'SMS message content (max 300 characters). Long messages may be split into multiple segments.',
    required: true,
  }),
});

const assistantDropdown = () =>
  Property.Dropdown({
    displayName: 'Assistant',
    description: 'Select the AI assistant to use for the call',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        const assistants = await famulorCommon.listAssistants({ auth: auth as string });
        
        if (!assistants || assistants.length === 0) {
          return {
            disabled: true,
            placeholder: 'No outbound assistants found. Create one first.',
            options: [],
          };
        }

        return {
          options: assistants.map((assistant: any) => ({
            label: assistant.name,
            value: assistant.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to fetch assistants',
          options: [],
        };
      }
    },
  });

export const makePhoneCall = () => ({
  assistant_id: assistantDropdown(),
  phone_number: phoneNumberProperty('Customer Phone Number', 'Enter the phone number to call'),
  variable: Property.Object({
    displayName: 'Variables',
    description: 'Variables to pass to the assistant during the call',
    required: false,
    defaultValue: {
      customer_name: 'John Doe',
      email: 'john@example.com',
    },
  }),
});

export const campaignControl = () => ({
  campaign: campaignDropdown(),
  action: Property.StaticDropdown({
    displayName: 'Action',
    description: 'Select the action to perform on the campaign',
    required: true,
    options: {
      options: [
        { label: 'Start Campaign', value: 'start' },
        { label: 'Stop Campaign', value: 'stop' },
      ],
    },
  }),
});

const leadDropdown = () =>
  Property.Dropdown({
    displayName: 'Lead',
    description: 'Select the lead to delete',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        const leads = await famulorCommon.listLeads({ auth: auth as string });
        
        if (!leads || leads.length === 0) {
          return {
            disabled: true,
            placeholder: 'No leads found.',
            options: [],
          };
        }

        return {
          options: leads.map((lead: any) => ({
            label: `${lead.phone_number} - ${lead.campaign?.name || 'Unknown Campaign'}`,
            value: lead.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to fetch leads',
          options: [],
        };
      }
    },
  });

export const deleteLead = () => ({
  lead_id: leadDropdown(),
});
