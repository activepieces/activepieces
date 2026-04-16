import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { campaignIdProp } from '../common/props';
import { cleanPayload, replyIoRequest } from '../common/client';

export const createAndPushToCampaignAction = createAction({
  name: 'create_and_push_to_campaign',
  displayName: 'Add Contact to Campaign',
  description:
    'Create a new contact (or update an existing one) and immediately enrol them in a campaign so they start receiving outreach emails.',
  auth: replyIoAuth,
  props: {
    campaignId: campaignIdProp,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The contact\'s email address. Used to identify and deduplicate contacts.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact\'s first name.',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact\'s last name.',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company or organisation the contact works for.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      description: 'Contact\'s job title, e.g. "VP of Sales" or "Marketing Manager".',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Contact\'s phone number.',
      required: false,
    }),
    linkedInProfile: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'Full URL to the contact\'s LinkedIn profile, e.g. https://linkedin.com/in/janedoe',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Internal notes about this contact. Not visible to the contact.',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City the contact is based in.',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State / Province',
      description: 'State or province the contact is based in.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country the contact is based in.',
      required: false,
    }),
    timeZoneId: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'IANA time zone name used to schedule emails at the right local time, e.g. "America/New_York" or "Europe/London".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/actions/addandpushtocampaign',
      body: cleanPayload({
        campaignId: Number(propsValue.campaignId),
        email: propsValue.email,
        firstName: propsValue.firstName,
        lastName: propsValue.lastName,
        company: propsValue.company,
        title: propsValue.title,
        phone: propsValue.phone,
        linkedInProfile: propsValue.linkedInProfile,
        notes: propsValue.notes,
        city: propsValue.city,
        state: propsValue.state,
        country: propsValue.country,
        timeZoneId: propsValue.timeZoneId,
      }),
    });

    return response.body;
  },
});
