import { Property, Store, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { errorText } from '../common/client';
import { listFields } from '../common/metadata';
import { CURSOR_KEY, PollCursor, initCursor, zohoNow } from '../common/polling';
import { pollModule, sampleModule } from '../common/record-trigger';

const MAX_EXTRA_FIELDS = 4;

const CONTACT_FIELDS = [
  'Owner',
  'Email',
  '$currency_symbol',
  '$field_states',
  'Other_Phone',
  'Mailing_State',
  'Other_State',
  '$sharing_permission',
  'Other_Country',
  'Last_Activity_Time',
  'Department',
  '$state',
  'Unsubscribed_Mode',
  '$process_flow',
  'Assistant',
  'Mailing_Country',
  'id',
  'Reporting_To',
  '$approval',
  'Enrich_Status__s',
  'Other_City',
  'Created_Time',
  '$wizard_connection_path',
  '$editable',
  'Home_Phone',
  'Created_By',
  '$zia_owner_assignment',
  'Secondary_Email',
  'Description',
  'Vendor_Name',
  'Mailing_Zip',
  '$review_process',
  'Twitter',
  'Other_Zip',
  'Mailing_Street',
  '$canvas_id',
  'Salutation',
  'First_Name',
  'Full_Name',
  'Asst_Phone',
  'Record_Image',
  'Modified_By',
  '$review',
  'Skype_ID',
  'Phone',
  'Account_Name',
];

export function contactFieldsParam(extra: unknown): string {
  const picked = Array.isArray(extra) ? extra.map(String).filter((f) => f && !CONTACT_FIELDS.includes(f)) : [];
  const unique = [...new Set(picked)].slice(0, MAX_EXTRA_FIELDS);
  return [...CONTACT_FIELDS, ...unique].join(',');
}

const newContactProps = {
  additional_fields: Property.MultiSelectDropdown({
    auth: zohoCrmAuth,
    displayName: 'Additional Fields',
    description: `Optional. Up to ${MAX_EXTRA_FIELDS} extra Contacts fields (for example custom fields) to include. Zoho returns at most 50 fields per record and this trigger already requests 46 standard ones.`,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Zoho CRM account first' };
      }
      try {
        const fields = await listFields({ auth, module: 'Contacts' });
        return {
          disabled: false,
          options: fields
            .filter((f) => f.visible !== false && !CONTACT_FIELDS.includes(f.api_name))
            .map((f) => ({ label: f.display_label ?? f.field_label ?? f.api_name, value: f.api_name })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: `Could not load fields: ${errorText(error)}` };
      }
    },
  }),
};

export const newContact = createTrigger({
  auth: zohoCrmAuth,

  name: 'new_contact',
  classification: 'READ',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  aiMetadata: {
    description: 'Fires when a new contact record is created in the connected Zoho CRM account, emitting that contact. Polls the Contacts module ordered by creation time, so it represents newly added contacts.',
  },
  sampleData: {
    Owner: {
      name: 'Activepieces Apps',
      id: '560094000000343001',
      email: 'apps@activepieces.com',
    },
    Email: 'capla-paprocki@yahoo.com',
    Description: null,
    $currency_symbol: '$',
    Vendor_Name: null,
    Mailing_Zip: '99501',
    $field_states: null,
    Other_Phone: null,
    Mailing_State: 'AK',
    $review_process: {
      approve: false,
      reject: false,
      resubmit: false,
    },
    Twitter: 'lpaprocki_sample',
    Other_Zip: null,
    Mailing_Street: '639 Main St',
    Other_State: null,
    $sharing_permission: 'full_access',
    Salutation: null,
    Other_Country: null,
    Last_Activity_Time: '2023-03-26T00:02:28+01:00',
    First_Name: 'Capla',
    Full_Name: 'Capla Paprocki (Sample)',
    Asst_Phone: null,
    Record_Image:
      'd7d6bec0cbbfd9f3b84ebcd2eba41e9fa432f48560f9ed267b2e5b26eb58a07f5451e24ca9042b39f05459c41291c005b0dea6b224d375a6030f4096eb631fa3d4dcabb97393f1dc2470eb1658164f05',
    Department: 'Admin',
    Modified_By: {
      name: 'Activepieces Apps',
      id: '560094000000343001',
      email: 'apps@activepieces.com',
    },
    $review: null,
    $state: 'save',
    Skype_ID: 'lpaprocki',
    Unsubscribed_Mode: null,
    $process_flow: false,
    Assistant: null,
    Phone: '555-555-5555',
    Mailing_Country: 'United States',
    id: '560094000000349199',
    Reporting_To: null,
    $approval: {
      delegate: false,
      approve: false,
      reject: false,
      resubmit: false,
    },
    Enrich_Status__s: null,
    Other_City: null,
    Created_Time: '2023-03-26T00:01:56+01:00',
    $wizard_connection_path: null,
    $editable: true,
    Home_Phone: null,
    Created_By: {
      name: 'Activepieces Apps',
      id: '560094000000343001',
      email: 'apps@activepieces.com',
    },
    $zia_owner_assignment: 'owner_recommendation_unavailable',
    Secondary_Email: null,
  },
  type: TriggerStrategy.POLLING,
  props: newContactProps,
  async onEnable(context): Promise<void> {
    if (context.isRepublish) {
      await adoptLegacyCursor(context.store);
    }
    await initCursor({ store: context.store, isRepublish: context.isRepublish, now: () => zohoNow({ auth: context.auth, module: 'Contacts' }) });
  },
  async onDisable(): Promise<void> {
    return;
  },
  async run(context) {
    await adoptLegacyCursor(context.store);
    return pollModule({
      auth: context.auth,
      store: context.store,
      module: 'Contacts',
      fields: contactFieldsParam(context.propsValue.additional_fields).split(','),
      sortBy: 'Created_Time',
      apiVersion: LEGACY_API_VERSION,
    });
  },
  async test(context): Promise<unknown[]> {
    return sampleModule({
      auth: context.auth,
      module: 'Contacts',
      fields: contactFieldsParam(context.propsValue.additional_fields).split(','),
      sortBy: 'Created_Time',
      apiVersion: LEGACY_API_VERSION,
    });
  },
});

async function adoptLegacyCursor(store: Store): Promise<void> {
  if (await store.get<PollCursor>(CURSOR_KEY)) {
    return;
  }
  const lastPoll = await store.get<unknown>(LEGACY_LAST_POLL_KEY);
  if (typeof lastPoll === 'number' && Number.isFinite(lastPoll)) {
    await store.put<PollCursor>(CURSOR_KEY, { time: lastPoll + 1, ids: [] });
    await store.delete(LEGACY_LAST_POLL_KEY);
  }
}

const LEGACY_LAST_POLL_KEY = 'lastPoll';
const LEGACY_API_VERSION = 'v4';
