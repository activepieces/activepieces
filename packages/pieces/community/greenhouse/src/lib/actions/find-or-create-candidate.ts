import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall, shapeCandidate, GreenhouseCandidate } from '../common';

export const findOrCreateCandidateAction = createAction({
  name: 'find_or_create_candidate',
  displayName: 'Find or Create Candidate',
  description:
    'Searches for a candidate by email address. If no match is found, creates a new candidate profile instead.',
  auth: greenhouseAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description:
        'The email address to search for. If a candidate with this address already exists, they will be returned as-is.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Required when creating a new candidate. Ignored if a match is found.',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Required when creating a new candidate. Ignored if a match is found.',
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
      description: 'Phone number to set on the new candidate. Ignored if a match is found.',
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
      description: 'Current employer to set on the new candidate. Ignored if a match is found.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Current Job Title',
      description: 'Current job title to set on the new candidate. Ignored if a match is found.',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description:
        "LinkedIn profile URL to set on the new candidate (e.g. `https://linkedin.com/in/johndoe`). Ignored if a match is found.",
      required: false,
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: 'Personal website or portfolio URL to set on the new candidate. Ignored if a match is found.',
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

    const searchResponse = await greenhouseApiCall<GreenhouseCandidate[]>({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      endpoint: '/candidates',
      queryParams: { email },
    });

    const existing = Array.isArray(searchResponse.body) ? searchResponse.body : [];

    if (existing.length > 0) {
      return { created: false, ...shapeCandidate(existing[0]) };
    }

    const body: Record<string, unknown> = { first_name, last_name };
    body['email_addresses'] = [{ value: email, type: email_type ?? 'personal' }];

    if (company) body['company'] = company;
    if (title) body['title'] = title;
    if (tags && (tags as string[]).length > 0) body['tags'] = tags;
    if (phone) body['phone_numbers'] = [{ value: phone, type: phone_type ?? 'mobile' }];
    if (website_url) body['website_addresses'] = [{ value: website_url, type: 'personal' }];
    if (linkedin_url) body['social_media_addresses'] = [{ value: linkedin_url }];

    const createResponse = await greenhouseApiCall<{ candidate: GreenhouseCandidate }>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      endpoint: '/candidates',
      body,
    });

    return { created: true, ...shapeCandidate(createResponse.body.candidate) };
  },
});
