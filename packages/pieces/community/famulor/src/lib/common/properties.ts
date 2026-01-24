import { Property } from '@activepieces/pieces-framework';
import { famulorCommon } from '.';
import { famulorAuth } from '../..';

// Dynamic Properties
const campaignDropdown = () =>
  Property.Dropdown({
    auth: famulorAuth,
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
        const campaigns = await famulorCommon.listCampaigns({ auth: auth.secret_text });
        
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
    auth: famulorAuth,
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
    auth: famulorAuth,
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
        const phoneNumbers = await famulorCommon.listPhoneNumbers({ auth: auth.secret_text });
        
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
    auth: famulorAuth,
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
        const assistants = await famulorCommon.listAssistants({ auth: auth.secret_text });
        
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
  Property.Dropdown<number,true,typeof famulorAuth>({
    auth: famulorAuth,
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
        const leads = await famulorCommon.listLeads({ auth: auth.secret_text });
        
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

const assistantIdProperty = (displayName: string, description: string, required = true) =>
  Property.Number({
    displayName,
    description,
    required,
  });

const assistantUuidProperty = (displayName: string, description: string, required = true) =>
  Property.ShortText({
    displayName,
    description,
    required,
  });

const conversationUuidProperty = (displayName: string, description: string, required = true) =>
  Property.ShortText({
    displayName,
    description,
    required,
  });

const customerIdentifierProperty = (displayName: string, description: string, required = true) =>
  Property.ShortText({
    displayName,
    description,
    required,
    defaultValue: '+49155551234',
  });

export const getCurrentUser = () => ({});

export const generateAiReply = () => ({
  assistant_id: assistantIdProperty(
    'Assistant ID',
    'The ID of the assistant to use for generating the response'
  ),
  customer_identifier: customerIdentifierProperty(
    'Customer Identifier',
    'A unique identifier for the customer (e.g., phone number, email, CRM contact ID). Maximum length: 255 characters.'
  ),
  message: Property.LongText({
    displayName: 'Message',
    description: 'The customer\'s message to respond to',
    required: true,
  }),
  variables: Property.Object({
    displayName: 'Variables',
    description: 'Optional context variables to pass to the assistant',
    required: false,
    defaultValue: {
      customer_name: 'John Smith',
      source: 'whatsapp',
    },
  }),
});

export const createConversation = () => ({
  assistant_id: assistantUuidProperty(
    'Assistant UUID',
    'The UUID of the assistant to start the conversation with'
  ),
  type: Property.StaticDropdown({
    displayName: 'Type',
    description: 'The type of conversation',
    required: false,
    defaultValue: 'widget',
    options: {
      options: [
        { label: 'Widget (charged)', value: 'widget' },
        { label: 'Test (free)', value: 'test' },
      ],
    },
  }),
  variables: Property.Object({
    displayName: 'Variables',
    description: 'Custom variables to pass to the assistant',
    required: false,
    defaultValue: {
      customer_name: 'John Smith',
      company: 'Acme Corp',
      source: 'pricing_page',
    },
  }),
});

export const getConversation = () => ({
  uuid: conversationUuidProperty(
    'Conversation UUID',
    'The unique UUID identifier of the conversation to retrieve'
  ),
});

export const sendMessage = () => ({
  uuid: conversationUuidProperty(
    'Conversation UUID',
    'The unique UUID identifier of the conversation'
  ),
  message: Property.LongText({
    displayName: 'Message',
    description: 'The user\'s message to send to the assistant. Maximum length: 2000 characters.',
    required: true,
  }),
});
