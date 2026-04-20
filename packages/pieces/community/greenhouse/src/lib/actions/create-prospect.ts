import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall, onBehalfOfProp } from '../common';

type EmailAddress = { value: string; type: string };
type PhoneNumber = { value: string; type: string };
type WebsiteAddress = { value: string; type: string };

type GreenhouseProspect = {
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

export const createProspectAction = createAction({
  name: 'create_prospect',
  displayName: 'Create Prospect',
  description: 'Creates a new prospect in Greenhouse — a person who has not yet applied to a specific job.',
  auth: greenhouseAuth,
  props: {
    on_behalf_of: onBehalfOfProp,
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "The prospect's first name.",
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "The prospect's last name.",
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: "The prospect's email address.",
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
      description: "The prospect's phone number.",
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
      description: "The prospect's current employer.",
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Current Job Title',
      description: "The prospect's current job title.",
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: "URL to the prospect's LinkedIn profile (e.g. `https://linkedin.com/in/johndoe`).",
      required: false,
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: "URL to the prospect's personal website or portfolio.",
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Labels to attach to this prospect (e.g. `referral`, `engineering`). Each item in the list becomes one tag.',
      required: false,
    }),
    prospect_pool_id: Property.ShortText({
      displayName: 'Prospect Pool ID',
      description:
        'The numeric ID of the prospect pool to add this person to. Find it in the Greenhouse URL when viewing the pool.',
      required: false,
    }),
    prospect_pool_stage_id: Property.ShortText({
      displayName: 'Prospect Pool Stage ID',
      description:
        'The numeric ID of the stage within the prospect pool. Must belong to the pool specified above.',
      required: false,
    }),
    prospect_owner_id: Property.ShortText({
      displayName: 'Prospect Owner (User ID)',
      description:
        "The numeric ID of the Greenhouse user who owns this prospect. Defaults to the 'Performed By' user if left blank.",
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
      prospect_pool_id,
      prospect_pool_stage_id,
      prospect_owner_id,
    } = context.propsValue;

    const body: Record<string, unknown> = { first_name, last_name };

    if (company) body['company'] = company;
    if (title) body['title'] = title;
    if (tags && (tags as string[]).length > 0) body['tags'] = tags;
    if (prospect_pool_id) body['prospect_pool_id'] = Number(prospect_pool_id);
    if (prospect_pool_stage_id) body['prospect_pool_stage_id'] = Number(prospect_pool_stage_id);
    if (prospect_owner_id) body['prospect_owner_id'] = Number(prospect_owner_id);

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

    const response = await greenhouseApiCall<GreenhouseProspect>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/prospects',
      body,
      onBehalfOf: on_behalf_of,
    });

    const p = response.body;
    return {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      company: p.company,
      title: p.title,
      created_at: p.created_at,
      updated_at: p.updated_at,
      last_activity: p.last_activity,
      is_private: p.is_private,
      photo_url: p.photo_url,
      primary_email: p.email_addresses?.[0]?.value ?? null,
      primary_email_type: p.email_addresses?.[0]?.type ?? null,
      primary_phone: p.phone_numbers?.[0]?.value ?? null,
      primary_phone_type: p.phone_numbers?.[0]?.type ?? null,
      linkedin_url:
        p.website_addresses?.find((w) => w.type === 'linkedin')?.value ?? null,
      website_url:
        p.website_addresses?.find((w) => w.type === 'personal')?.value ?? null,
      tags: (p.tags ?? []).join(', '),
      application_ids: (p.application_ids ?? []).join(', '),
    };
  },
});
