import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall } from '../common';

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

export const findCandidateAction = createAction({
  name: 'find_candidate',
  displayName: 'Find Candidate',
  description: 'Searches for a candidate in Greenhouse by email address. Returns the first match.',
  auth: greenhouseAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to search for. Returns the first candidate whose profile contains this address.',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;

    const response = await greenhouseApiCall<GreenhouseCandidate[]>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      endpoint: '/candidates',
      queryParams: { email },
    });

    const candidates = response.body;

    if (!candidates || candidates.length === 0) {
      return { found: false, candidate: null };
    }

    const c = candidates[0];
    return {
      found: true,
      candidate: {
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
      },
    };
  },
});
