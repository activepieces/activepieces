import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall, shapeCandidate } from '../common';

export const createCandidateAction = createAction({
  name: 'create_candidate',
  displayName: 'Create Candidate',
  description: 'Creates a new candidate profile in Greenhouse.',
  auth: greenhouseAuth,
  props: {
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
    if (email) body['email_addresses'] = [{ value: email, type: email_type ?? 'personal' }];
    if (phone) body['phone_numbers'] = [{ value: phone, type: phone_type ?? 'mobile' }];
    if (website_url) body['website_addresses'] = [{ value: website_url, type: 'personal' }];
    if (linkedin_url) body['social_media_addresses'] = [{ value: linkedin_url }];

    const response = await greenhouseApiCall<{ candidate: Parameters<typeof shapeCandidate>[0] }>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      endpoint: '/candidates',
      body,
    });

    return shapeCandidate(response.body.candidate);
  },
});
