import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { woodpeckerAuth } from '../..';
import { campaignsDropdown, woodpeckerClient } from '../common';

export const addProspectToCampaign = createAction({
  auth: woodpeckerAuth,
  name: 'add_prospect_to_campaign',
  displayName: 'Create/Update Prospect in Campaign',
  description: 'Adds a new prospect or updates existing prospect data in a campaign',
  props: {
    campaign_id: campaignsDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Prospect email address',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Tags starting with # separated by spaces (e.g. #VC #Startup)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Prospect status in the campaign',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Paused', value: 'PAUSED' },
          { label: 'To Review', value: 'TO-REVIEW' },
          { label: 'To Check', value: 'TO-CHECK' },
        ],
      },
    }),
    snippets: Property.Array({
      displayName: 'Snippets',
      description: 'Custom snippets for personalization (supports HTML). Max 15 snippets.',
      required: false,
    }),
    send_after: Property.DateTime({
      displayName: 'Send After',
      description: 'Earliest date and time the prospect can be contacted',
      required: false,
    }),
    force: Property.Checkbox({
      displayName: 'Force Add',
      description: 'Add prospect even if their global status is not ACTIVE (use with caution)',
      required: false,
      defaultValue: false,
    }),
    file_name: Property.ShortText({
      displayName: 'Import Batch Name',
      description: 'Name of the import batch (visible in the imported column)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const prospect: Record<string, unknown> = {
      email: propsValue.email,
    };

    const optionalFields = [
      'first_name',
      'last_name',
      'company',
      'website',
      'linkedin_url',
      'tags',
      'title',
      'phone',
      'address',
      'city',
      'state',
      'country',
      'industry',
      'status',
    ] as const;

    for (const field of optionalFields) {
      if (propsValue[field]) {
        prospect[field] = propsValue[field];
      }
    }

    if (propsValue.snippets && Array.isArray(propsValue.snippets)) {
      const snippets = propsValue.snippets.slice(0, 15);
      snippets.forEach((value, index) => {
        if (value) {
          prospect[`snippet${index + 1}`] = value;
        }
      });
    }

    const campaign: Record<string, unknown> = {
      campaign_id: propsValue.campaign_id,
    };

    if (propsValue.send_after) {
      campaign['send_after'] = propsValue.send_after;
    }

    const body: Record<string, unknown> = {
      campaign,
      prospects: [prospect],
    };

    if (propsValue.force) {
      body['force'] = true;
    }

    if (propsValue.file_name) {
      body['file_name'] = propsValue.file_name;
    }

    return await woodpeckerClient.makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/v1/add_prospects_campaign',
      body
    );
  },
});
