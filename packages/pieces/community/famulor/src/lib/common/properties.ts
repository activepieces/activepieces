import { Property } from '@activepieces/pieces-framework';
import { famulorCommon } from '.';
import { famulorAuth } from '../..';

// Dynamic Properties
const campaignDropdown = (options: { required: boolean; description: string }) =>
  Property.Dropdown({
    auth: famulorAuth,
    displayName: 'Campaign',
    description: options.description,
    required: options.required,
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

const campaignDropdownRequired = () =>
  campaignDropdown({
    required: true,
    description: 'Select the campaign',
  });

const campaignDropdownOptional = () =>
  campaignDropdown({
    required: false,
    description: 'Optionally assign the lead to a different campaign',
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
  campaign: campaignDropdownRequired(),
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
        const phoneNumbers = await famulorCommon.listPhoneNumbers({
          auth: auth.secret_text,
        });

        if (!phoneNumbers || phoneNumbers.length === 0) {
          return {
            disabled: true,
            placeholder: 'No phone numbers found. Purchase an SMS-capable phone number first.',
            options: [],
          };
        }

        return {
          options: phoneNumbers.map((phoneNumber) => ({
            label: `${phoneNumber.phone_number} (${phoneNumber.type_label})`,
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

const campaignPhoneNumbersMultiSelect = () =>
  Property.MultiSelectDropdown<number, false, typeof famulorAuth>({
    auth: famulorAuth,
    displayName: 'Outbound phone numbers',
    description:
      'Optional. Caller IDs for this campaign (distinct phone number IDs).',
    required: false,
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
        const phoneNumbers = await famulorCommon.listPhoneNumbers({
          auth: auth.secret_text,
          type: 'outbound',
        });

        if (!phoneNumbers || phoneNumbers.length === 0) {
          return {
            disabled: true,
            placeholder: 'No outbound-assignable phone numbers found.',
            options: [],
          };
        }

        return {
          options: phoneNumbers.map((phoneNumber) => ({
            label: `${phoneNumber.phone_number} (${phoneNumber.type_label}, ${phoneNumber.country_code})`,
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

export const createCampaign = () => ({
  name: Property.ShortText({
    displayName: 'Campaign name',
    description: 'Name of the outbound campaign (max 255 characters)',
    required: true,
  }),
  assistant_id: assistantDropdown(),
  timezone: Property.ShortText({
    displayName: 'Timezone',
    description:
      'IANA timezone (e.g. Europe/Berlin, America/New_York). Leave empty for account default.',
    required: false,
  }),
  max_calls_in_parallel: Property.Number({
    displayName: 'Max calls in parallel',
    description: '1–10 simultaneous calls (your plan may limit further)',
    required: false,
    defaultValue: 3,
  }),
  allowed_hours_start_time: Property.ShortText({
    displayName: 'Allowed hours start',
    description: 'Calling window start (H:i, e.g. 09:00)',
    required: false,
    defaultValue: '09:00',
  }),
  allowed_hours_end_time: Property.ShortText({
    displayName: 'Allowed hours end',
    description: 'Calling window end (H:i, e.g. 17:00)',
    required: false,
    defaultValue: '17:00',
  }),
  allowed_days: Property.StaticMultiSelectDropdown({
    displayName: 'Allowed weekdays',
    description:
      'Leave empty to use API default (all days). Otherwise restrict to selected days.',
    required: false,
    options: {
      options: [
        { label: 'Monday', value: 'monday' },
        { label: 'Tuesday', value: 'tuesday' },
        { label: 'Wednesday', value: 'wednesday' },
        { label: 'Thursday', value: 'thursday' },
        { label: 'Friday', value: 'friday' },
        { label: 'Saturday', value: 'saturday' },
        { label: 'Sunday', value: 'sunday' },
      ],
    },
  }),
  max_retries: Property.Number({
    displayName: 'Max retries',
    description: '1–5 retry attempts for failed calls',
    required: false,
    defaultValue: 3,
  }),
  retry_interval: Property.Number({
    displayName: 'Retry interval (minutes)',
    description: '10–4320 minutes between retries',
    required: false,
    defaultValue: 60,
  }),
  retry_on_voicemail: Property.Checkbox({
    displayName: 'Retry on voicemail',
    description: 'Retry when the call reaches voicemail',
    required: false,
    defaultValue: false,
  }),
  retry_on_goal_incomplete: Property.Checkbox({
    displayName: 'Retry on goal incomplete',
    description: 'Retry when the call goal was not completed',
    required: false,
    defaultValue: false,
  }),
  goal_completion_variable: Property.ShortText({
    displayName: 'Goal completion variable',
    description:
      'Name of a boolean variable from the assistant post-call schema (max 255 characters)',
    required: false,
  }),
  mark_complete_when_no_leads: Property.Checkbox({
    displayName: 'Mark complete when no leads',
    description: 'Mark the campaign complete when there are no leads left to call',
    required: false,
    defaultValue: true,
  }),
  phone_number_ids: campaignPhoneNumbersMultiSelect(),
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
  campaign: campaignDropdownRequired(),
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
        const { leads } = await famulorCommon.listLeads({ auth: auth.secret_text });

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

export const updateLead = () => ({
  lead_id: leadDropdown(),
  campaign: campaignDropdownOptional(),
  phone_number: phoneNumberProperty(
    'Phone Number',
    'New phone number in E.164 format (leave empty to keep unchanged)',
    false,
  ),
  status: Property.StaticDropdown({
    displayName: 'Status',
    description:
      'Lead status: created, completed, or reached-max-retries (leave unselected to keep unchanged)',
    required: false,
    options: {
      options: [
        { label: 'Created', value: 'created' },
        { label: 'Completed', value: 'completed' },
        { label: 'Reached max retries', value: 'reached-max-retries' },
      ],
    },
  }),
  variables: Property.Object({
    displayName: 'Variables',
    description: 'Custom fields merged with existing lead variables (leave empty to skip)',
    required: false,
    defaultValue: {},
  }),
});

const assistantIdDropdown = (displayName: string, description: string, required = true) =>
  Property.Dropdown<number, boolean, typeof famulorAuth>({
    auth: famulorAuth,
    displayName,
    description,
    required,
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
        const allAssistants = await famulorCommon.fetchAllAssistantPages({
          auth: auth.secret_text,
        });

        if (allAssistants.length === 0) {
          return {
            disabled: true,
            placeholder: 'No assistants found. Create one first.',
            options: [],
          };
        }

        return {
          options: allAssistants.map((a: any) => ({
            label: `${a.name} (${a.type} - ${a.status})`,
            value: a.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          placeholder: 'Failed to fetch assistants',
          options: [],
        };
      }
    },
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
    defaultValue: '+1234567890',
  });

export const getCurrentUser = () => ({});

export const listLeads = () => ({});

export const listAccountPhoneNumbers = () => ({});

export const searchAvailablePhoneNumbers = () => ({
  country_code: Property.StaticDropdown({
    displayName: 'Country code',
    description:
      'ISO 3166-1 alpha-2 country code to search in (supported regions per Famulor docs).',
    required: true,
    defaultValue: 'DE',
    options: {
      options: [
        { label: 'Germany (DE)', value: 'DE' },
        { label: 'United States (US)', value: 'US' },
        { label: 'Canada (CA)', value: 'CA' },
        { label: 'United Kingdom (GB)', value: 'GB' },
        { label: 'Australia (AU)', value: 'AU' },
        { label: 'Israel (IL)', value: 'IL' },
        { label: 'Poland (PL)', value: 'PL' },
        { label: 'Finland (FI)', value: 'FI' },
        { label: 'Netherlands (NL)', value: 'NL' },
        { label: 'Denmark (DK)', value: 'DK' },
        { label: 'Italy (IT)', value: 'IT' },
      ],
    },
  }),
  contains: Property.ShortText({
    displayName: 'Contains (digits)',
    description:
      'Optional. Only return numbers that contain these digits (numeric only, max 10 digits).',
    required: false,
  }),
});

export const purchasePhoneNumber = () => ({
  phone_number: phoneNumberProperty(
    'Phone number',
    'Exact E.164 value from Search Available Phone Numbers. Requires a payment method on file; creates a monthly subscription.',
  ),
});

export const generateAiReply = () => ({
  assistant_id: assistantIdDropdown(
    'Assistant',
    'Select the assistant to generate a response with'
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
    defaultValue: {},
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
    defaultValue: {},
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
    description:
      'User message to send (max 2000 characters). The assistant\'s reply is returned in the action output field `message`.',
    required: true,
  }),
});

export const listConversations = () => ({
  type: Property.StaticDropdown({
    displayName: 'Conversation type',
    description: 'Filter by channel (optional)',
    required: false,
    options: {
      options: [
        { label: 'Test', value: 'test' },
        { label: 'Widget', value: 'widget' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'API', value: 'api' },
      ],
    },
  }),
  assistant_id: Property.Number({
    displayName: 'Assistant ID',
    description: 'Filter by assistant numeric ID (must belong to your account)',
    required: false,
  }),
  customer_phone: Property.ShortText({
    displayName: 'Customer phone',
    description: 'Exact match (E.164, e.g. +49123456789)',
    required: false,
  }),
  whatsapp_sender_phone: Property.ShortText({
    displayName: 'WhatsApp sender phone',
    description: 'Filter by WhatsApp Business sender number (exact match)',
    required: false,
  }),
  external_identifier: Property.ShortText({
    displayName: 'External identifier',
    description: 'Filter by CRM / external reference',
    required: false,
  }),
  per_page: Property.Number({
    displayName: 'Per page',
    description: 'Page size (1–100). Default on the API is 15 if omitted.',
    required: false,
    defaultValue: 15,
  }),
  cursor: Property.ShortText({
    displayName: 'Cursor',
    description: 'Pagination cursor (paste next_cursor from a previous list response)',
    required: false,
  }),
});

export const listCalls = () => ({
  status: Property.StaticDropdown({
    displayName: 'Status',
    description: 'Filter by call status (optional)',
    required: false,
    options: {
      options: [
        { label: 'Initiated', value: 'initiated' },
        { label: 'Ringing', value: 'ringing' },
        { label: 'Busy', value: 'busy' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Ended', value: 'ended' },
        { label: 'Completed', value: 'completed' },
        { label: 'Ended by customer', value: 'ended_by_customer' },
        { label: 'Ended by assistant', value: 'ended_by_assistant' },
        { label: 'No answer', value: 'no-answer' },
        { label: 'Failed', value: 'failed' },
      ],
    },
  }),
  type: Property.StaticDropdown({
    displayName: 'Call type',
    description: 'Inbound, outbound, or web (optional)',
    required: false,
    options: {
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
        { label: 'Web', value: 'web' },
      ],
    },
  }),
  phone_number: Property.ShortText({
    displayName: 'Client phone number',
    description: 'Filter by client phone number',
    required: false,
  }),
  assistant_id: Property.Number({
    displayName: 'Assistant ID',
    description: 'Filter by assistant ID',
    required: false,
  }),
  campaign_id: Property.Number({
    displayName: 'Campaign ID',
    description: 'Filter by campaign ID',
    required: false,
  }),
  date_from: Property.ShortText({
    displayName: 'Date from',
    description: 'Start date (YYYY-MM-DD)',
    required: false,
  }),
  date_to: Property.ShortText({
    displayName: 'Date to',
    description: 'End date (YYYY-MM-DD)',
    required: false,
  }),
  per_page: Property.Number({
    displayName: 'Per page',
    description: 'Results per page (1–100). API default is 15.',
    required: false,
    defaultValue: 15,
  }),
  page: Property.Number({
    displayName: 'Page',
    description: 'Page number (default 1)',
    required: false,
    defaultValue: 1,
  }),
});

export const getCall = () => ({
  call_id: Property.Number({
    displayName: 'Call ID',
    description: 'Numeric ID of the call (from list calls or Famulor UI)',
    required: true,
  }),
});

export const deleteCall = () => ({
  call_id: Property.Number({
    displayName: 'Call ID',
    description:
      'Numeric ID of the call to delete permanently (transcript, recording, and metadata are removed)',
    required: true,
  }),
});

export const getWhatsAppSenders = () => ({
  status: Property.StaticDropdown({
    displayName: 'Status filter',
    description:
      'Online only (default API behavior) or all senders including offline. Use sender `id` as sender_id when sending WhatsApp messages.',
    required: false,
    defaultValue: 'online',
    options: {
      options: [
        { label: 'Online only', value: 'online' },
        { label: 'All senders', value: 'all' },
      ],
    },
  }),
});

export const getWhatsAppTemplates = () => ({
  sender_id: Property.Number({
    displayName: 'Sender ID',
    description:
      'WhatsApp sender numeric ID from Get WhatsApp Senders (the sender `id` field)',
    required: true,
  }),
  status: Property.StaticDropdown({
    displayName: 'Template approval status',
    description:
      'Approved templates only (default API behavior) or all templates including pending/rejected',
    required: false,
    defaultValue: 'approved',
    options: {
      options: [
        { label: 'Approved only', value: 'approved' },
        { label: 'All statuses', value: 'all' },
      ],
    },
  }),
});

export const sendWhatsAppTemplate = () => ({
  sender_id: Property.Number({
    displayName: 'Sender ID',
    description: 'WhatsApp sender ID from Get WhatsApp Senders',
    required: true,
  }),
  template_id: Property.Number({
    displayName: 'Template ID',
    description: 'Template ID from Get WhatsApp Templates (must be approved)',
    required: true,
  }),
  recipient_phone: phoneNumberProperty(
    'Recipient phone',
    'Recipient phone number',
    true,
  ),
  recipient_name: Property.ShortText({
    displayName: 'Recipient name',
    description: 'Optional. Used for conversation tracking and CRM (max 255 characters)',
    required: false,
  }),
  variables: Property.Object({
    displayName: 'Template variables',
    description:
      'Key-value pairs: use "1", "2", … or names from the template `variables` array. Leave empty if the template has no placeholders.',
    required: false,
    defaultValue: {},
  }),
});

export const sendWhatsAppFreeform = () => ({
  sender_id: Property.Number({
    displayName: 'Sender ID',
    description: 'WhatsApp sender ID from Get WhatsApp Senders (sender must be online)',
    required: true,
  }),
  recipient_phone: phoneNumberProperty(
    'Recipient phone',
    'Recipient phone number',
    true,
  ),
  message: Property.LongText({
    displayName: 'Message',
    description:
      'Free-text content (max 4096 characters). Only works within an active 24-hour messaging window; otherwise send a template first.',
    required: true,
  }),
});

export const getWhatsAppSessionStatus = () => ({
  sender_id: Property.Number({
    displayName: 'Sender ID',
    description: 'WhatsApp sender ID from Get WhatsApp Senders',
    required: true,
  }),
  recipient_phone: phoneNumberProperty(
    'Recipient phone',
    'Recipient to check the 24-hour window for',
    true,
  ),
});
