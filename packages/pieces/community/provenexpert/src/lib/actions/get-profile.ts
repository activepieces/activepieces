import { createAction } from '@activepieces/pieces-framework';
import { provenExpertAuth } from '../common/auth';
import { provenExpertCommon } from '../common';

type ProfileResponse = {
  status: string;
  profile?: {
    created?: number;
    email?: string;
    profileUrl?: string;
    public?: number;
    company?: string;
    description?: string;
    contact?: {
      person?: string;
      street?: string;
      city?: string;
      zip?: string;
      country?: string;
      phone?: string;
      website?: string;
    };
  };
};

export const getProfileAction = createAction({
  auth: provenExpertAuth,
  name: 'get_profile',
  displayName: 'Get Profile',
  description: 'Retrieves the company and contact details of your ProvenExpert profile.',
  props: {},
  async run(context) {
    const response = await provenExpertCommon.apiCall<ProfileResponse>({
      auth: context.auth.props,
      path: '/profile/get',
    });
    const profile = response.body.profile ?? {};
    const contact = profile.contact ?? {};
    return {
      status: response.body.status,
      created_at: profile.created
        ? new Date(profile.created * 1000).toISOString()
        : null,
      email: profile.email ?? null,
      profile_url: profile.profileUrl ?? null,
      is_public: profile.public === 1,
      company: profile.company ?? null,
      description: profile.description ?? null,
      contact_person: contact.person ?? null,
      contact_street: contact.street ?? null,
      contact_city: contact.city ?? null,
      contact_zip: contact.zip ?? null,
      contact_country: contact.country ?? null,
      contact_phone: contact.phone ?? null,
      contact_website: contact.website ?? null,
    };
  },
});
