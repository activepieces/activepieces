import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { woodpeckerAuth } from '../..';
import { woodpeckerClient } from '../common';

export const addProspectToList = createAction({
  auth: woodpeckerAuth,
  name: 'add_prospect_to_list',
  displayName: 'Create/Update Prospect',
  description: 'Adds a new prospect or updates existing prospect in the global prospect list',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Prospect email address',
      required: true,
    }),
    update: Property.Checkbox({
      displayName: 'Update Existing',
      description: 'If enabled, updates existing prospect data. If disabled, existing prospects remain unchanged.',
      required: false,
      defaultValue: false,
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
      description: 'Tags starting with # separated by spaces (e.g. #VC #Startup). Appends to existing tags when updating.',
      required: false,
    }),
    set_tags: Property.ShortText({
      displayName: 'Replace Tags',
      description: 'Replaces all existing tags with these (only when updating). Use empty string to clear all tags.',
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
      description: 'Prospect status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Blacklist', value: 'BLACKLIST' },
          { label: 'Bounced', value: 'BOUNCED' },
          { label: 'Invalid', value: 'INVALID' },
          { label: 'Replied', value: 'REPLIED' },
        ],
      },
    }),
    snippets: Property.Array({
      displayName: 'Snippets',
      description: 'Custom snippets for personalization (supports HTML). Max 15 snippets.',
      required: false,
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

    if (propsValue.update && propsValue.set_tags !== undefined) {
      prospect['set_tags'] = propsValue.set_tags;
    }

    if (propsValue.snippets && Array.isArray(propsValue.snippets)) {
      const snippets = propsValue.snippets.slice(0, 15);
      snippets.forEach((value, index) => {
        if (value) {
          prospect[`snippet${index + 1}`] = value;
        }
      });
    }

    const body: Record<string, unknown> = {
      prospects: [prospect],
    };

    if (propsValue.update) {
      body['update'] = true;
    }

    if (propsValue.file_name) {
      body['file_name'] = propsValue.file_name;
    }

    return await woodpeckerClient.makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/v1/add_prospects_list',
      body
    );
  },
});
