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

export const findOrCreateCandidateAction = createAction({
  name: 'find_or_create_candidate',
  displayName: 'Find or Create Candidate',
  description:
    'Searches for a candidate by email address. If no match is found, creates a new candidate profile instead.',
  auth: greenhouseAuth,
  props: {
    on_behalf_of: onBehalfOfProp,
    email: Property.ShortText({
      displayName: 'Email Address',
      description:
        'The email address to search for. If a candidate with this address already exists, they will be returned as-is.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "Required when creating a new candidate. Ignored if a match is found.",
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "Required when creating a new candidate. Ignored if a match is found.",
      required: true,
    }),
    email_type: Property.StaticDropdown({
      displayName: 'Email Type',
      description: 'The type of email address. Used only when creating a new candidate.',
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
      description: "Phone number to set on the new candidate. Ignored if a match is found.",
      required: false,
    }),
    phone_type: Property.StaticDropdown({
      displayName: 'Phone Type',
      description: 'The type of phone number. Used only when creating a new candidate.',
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
      description: "Current employer to set on the new candidate. Ignored if a match is found.",
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Current Job Title',
      description: "Current job title to set on the new candidate. Ignored if a match is found.",
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: "LinkedIn profile URL to set on the new candidate (e.g. `https://linkedin.com/in/johndoe`). Ignored if a match is found.",
      required: false,
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: "Personal website or portfolio URL to set on the new candidate. Ignored if a match is found.",
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to attach to the new candidate. Ignored if a match is found.',
      required: false,
    }),
  },
  async run(context) {
    const {
      on_behalf_of,
      email,
      first_name,
      last_name,
      email_type,
      phone,
      phone_type,
      company,
      title,
      linkedin_url,
      website_url,
      tags,
    } = context.propsValue;

    // Search first
    const searchResponse = await greenhouseApiCall<GreenhouseCandidate[]>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      endpoint: '/candidates',
      queryParams: { email },
    });

    const existing = searchResponse.body;
    if (existing && existing.length > 0) {
      const c = existing[0];
      return {
        created: false,
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
    }

    // Not found — create
    const body: Record<string, unknown> = { first_name, last_name };

    body['email_addresses'] = [{ value: email, type: email_type ?? 'personal' }];

    if (company) body['company'] = company;
    if (title) body['title'] = title;
    if (tags && (tags as string[]).length > 0) body['tags'] = tags;

    if (phone) {
      body['phone_numbers'] = [{ value: phone, type: phone_type ?? 'mobile' }];
    }

    const websiteAddresses: WebsiteAddress[] = [];
    if (linkedin_url) websiteAddresses.push({ value: linkedin_url, type: 'linkedin' });
    if (website_url) websiteAddresses.push({ value: website_url, type: 'personal' });
    if (websiteAddresses.length > 0) body['website_addresses'] = websiteAddresses;

    const createResponse = await greenhouseApiCall<GreenhouseCandidate>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/candidates',
      body,
      onBehalfOf: on_behalf_of,
    });

    const c = createResponse.body;
    return {
      created: true,
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
