import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall, onBehalfOfProp } from '../common';

type EmailAddress = { value: string; type: string };
type PhoneNumber = { value: string; type: string };
type WebsiteAddress = { value: string; type: string };

type GreenhouseCandidate = {
  id: number;
  first_name: string;
  last_name: string;
  company: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_activity: string | null;
  is_private: boolean;
  photo_url: string | null;
  application_ids: number[];
  email_addresses: EmailAddress[];
  phone_numbers: PhoneNumber[];
  website_addresses: WebsiteAddress[];
  tags: string[];
};

export const updateCandidateAction = createAction({
  name: 'update_candidate',
  displayName: 'Update Candidate',
  description: 'Updates an existing candidate profile in Greenhouse. Only fields you provide will be changed.',
  auth: greenhouseAuth,
  props: {
    on_behalf_of: onBehalfOfProp,
    candidate_id: Property.ShortText({
      displayName: 'Candidate ID',
      description:
        'The numeric ID of the candidate to update. Found in the candidate URL in Greenhouse ' +
        '(e.g. `https://app.greenhouse.io/people/**123456**`), or mapped from a previous **Create Candidate** step.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "Updated first name for the candidate.",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "Updated last name for the candidate.",
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: "Updated email address. This replaces the candidate's primary email.",
      required: false,
    }),
    email_type: Property.StaticDropdown({
      displayName: 'Email Type',
      description: 'The type of the updated email address.',
      required: false,
      defaultValue: 'personal',
      options: {
        options: [
          { label: 'Personal', value: 'personal' },
          { label: 'Work', value: 'work' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: "Updated phone number. This replaces the candidate's primary phone.",
      required: false,
    }),
    phone_type: Property.StaticDropdown({
      displayName: 'Phone Type',
      description: 'The type of the updated phone number.',
      required: false,
      defaultValue: 'mobile',
      options: {
        options: [
          { label: 'Mobile', value: 'mobile' },
          { label: 'Home', value: 'home' },
          { label: 'Work', value: 'work' },
          { label: 'Skype', value: 'skype' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    company: Property.ShortText({
      displayName: 'Current Company',
      description: "Updated current employer.",
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Current Job Title',
      description: "Updated current job title.",
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: "Updated LinkedIn profile URL (e.g. `https://linkedin.com/in/johndoe`).",
      required: false,
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: "Updated personal website or portfolio URL.",
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Replaces all existing tags on the candidate with this list. Leave blank to keep existing tags unchanged.',
      required: false,
    }),
  },
  async run(context) {
    const {
      on_behalf_of,
      candidate_id,
      first_name,
      last_name,
      email,
      email_type,
      phone,
      phone_type,
      company,
      title,
      linkedin_url,
      website_url,
      tags,
    } = context.propsValue;

    const body: Record<string, unknown> = {};

    if (first_name) body['first_name'] = first_name;
    if (last_name) body['last_name'] = last_name;
    if (company) body['company'] = company;
    if (title) body['title'] = title;
    if (tags && (tags as string[]).length > 0) body['tags'] = tags;

    if (email) {
      body['email_addresses'] = [{ value: email, type: email_type ?? 'personal' }];
    }
    if (phone) {
      body['phone_numbers'] = [{ value: phone, type: phone_type ?? 'mobile' }];
    }

    const websiteAddresses: WebsiteAddress[] = [];
    if (linkedin_url) websiteAddresses.push({ value: linkedin_url, type: 'linkedin' });
    if (website_url) websiteAddresses.push({ value: website_url, type: 'personal' });
    if (websiteAddresses.length > 0) body['website_addresses'] = websiteAddresses;

    const response = await greenhouseApiCall<GreenhouseCandidate>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      endpoint: `/candidates/${candidate_id}`,
      body,
      onBehalfOf: on_behalf_of,
    });

    const c = response.body;
    return {
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      company: c.company,
      title: c.title,
      created_at: c.created_at,
      updated_at: c.updated_at,
      last_activity: c.last_activity,
      is_private: c.is_private,
      photo_url: c.photo_url,
      primary_email: c.email_addresses?.[0]?.value ?? null,
      primary_email_type: c.email_addresses?.[0]?.type ?? null,
      primary_phone: c.phone_numbers?.[0]?.value ?? null,
      primary_phone_type: c.phone_numbers?.[0]?.type ?? null,
      linkedin_url:
        c.website_addresses?.find((w) => w.type === 'linkedin')?.value ?? null,
      website_url:
        c.website_addresses?.find((w) => w.type === 'personal')?.value ?? null,
      tags: (c.tags ?? []).join(', '),
      application_ids: (c.application_ids ?? []).join(', '),
    };
  },
});
