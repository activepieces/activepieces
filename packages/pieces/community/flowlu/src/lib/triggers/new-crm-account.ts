import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../auth';
import { flowluPollingHooks } from '../common/polling-trigger';
import { accountTriggerOutputSchema } from '../output-schemas';

export const newCrmAccountTrigger = createTrigger({
  auth: flowluAuth,
  name: 'new_crm_account',
  displayName: 'New CRM Account',
  description: 'Triggers when a new CRM contact or organization is created.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each new Flowlu CRM account created after the trigger was turned on: contacts, organizations, or both (account_type). Each run carries one account record.',
  },
  props: {
    account_type: Property.StaticDropdown({
      displayName: 'Account Type',
      description: 'Which new accounts start the flow.',
      required: false,
      defaultValue: 'any',
      options: {
        disabled: false,
        options: [
          { label: 'Contacts and organizations', value: 'any' },
          { label: 'Contacts only', value: 'contact' },
          { label: 'Organizations only', value: 'organization' },
        ],
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  ...flowluPollingHooks({
    source: { module: 'crm', entity: 'account' },
    filters: (props) => ({
      'filter[type]':
        props['account_type'] === 'contact'
          ? 2
          : props['account_type'] === 'organization'
          ? 1
          : undefined,
    }),
  }),
  outputSchema: accountTriggerOutputSchema,
  sampleData: {
    id: 19,
    type: 2,
    name: 'Ms. AP-TEST-Jane Doe',
    first_name: 'AP-TEST-Jane',
    middle_name: '',
    last_name: 'Doe',
    name_legal_full: 'Ms. AP-TEST-Jane Doe',
    email: 'jane@example.com',
    phone: '+15550101',
    phone2: '+15550199',
    phone3: '',
    web: '',
    owner_id: 0,
    account_category_id: 0,
    industry_id: 0,
    honorific_title_id: 3,
    VAT: '',
    description: '',
    telegram: '',
    social_network_link_1: '',
    social_network_link_3: '',
    social_network_link_4: '',
    social_network_link_5: '',
    social_network_link_6: '',
    billing_country: '',
    billing_state: '',
    billing_city: '',
    billing_zip: '',
    billing_address_line_1: '',
    shipping_country: '',
    shipping_city: '',
    shipping_address_line_1: '',
    active: 1,
    created_date: '2026-10-01 07:01:33',
    updated_date: '2026-10-01 07:02:11',
  },
});
