import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall, shapeCandidate, GreenhouseCandidate } from '../common';

export const createProspectAction = createAction({
  name: 'create_prospect',
  displayName: 'Create Prospect',
  description: 'Creates a new prospect in Greenhouse — a person who has not yet applied to a specific job.',
  auth: greenhouseAuth,
  props: {
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

    const body: Record<string, unknown> = {
      first_name,
      last_name,
      application: { prospect: true },
    };

    if (company) body['company'] = company;
    if (title) body['title'] = title;
    if (tags && (tags as string[]).length > 0) body['tags'] = tags;
    if (email) body['email_addresses'] = [{ value: email, type: email_type ?? 'personal' }];
    if (phone) body['phone_numbers'] = [{ value: phone, type: phone_type ?? 'mobile' }];
    if (website_url) body['website_addresses'] = [{ value: website_url, type: 'personal' }];
    if (linkedin_url) body['social_media_addresses'] = [{ value: linkedin_url }];

    const response = await greenhouseApiCall<{ candidate: GreenhouseCandidate }>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      endpoint: '/candidates',
      body,
    });

    return shapeCandidate(response.body.candidate);
  },
});
