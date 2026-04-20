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

export const createCandidateAction = createAction({
  name: 'create_candidate',
  displayName: 'Create Candidate',
  description: 'Creates a new candidate profile in Greenhouse.',
  auth: greenhouseAuth,
  props: {
    on_behalf_of: onBehalfOfProp,
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "The candidate's first name.",
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "The candidate's last name.",
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: "The candidate's email address.",
      required: false,
    }),
    email_type: Property.StaticDropdown({
      displayName: 'Email Type',
      description: 'The type of email address provided.',
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
      description: "The candidate's phone number.",
      required: false,
    }),
    phone_type: Property.StaticDropdown({
      displayName: 'Phone Type',
      description: 'The type of phone number provided.',
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
      description: "The candidate's current employer.",
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Current Job Title',
      description: "The candidate's current job title.",
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: "URL to the candidate's LinkedIn profile (e.g. `https://linkedin.com/in/johndoe`).",
      required: false,
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: "URL to the candidate's personal website or portfolio.",
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Labels to attach to this candidate (e.g. `referral`, `engineering`). Each item in the list becomes one tag.',
      required: false,
    }),
  },
  async run(context) {
    const {
      on_behalf_of,
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

    const body: Record<string, unknown> = { first_name, last_name };

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
      method: HttpMethod.POST,
      endpoint: '/candidates',
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
