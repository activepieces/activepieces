import { createAction, Property } from '@activepieces/pieces-framework';
import { dataforb2bAuth, dataForB2BRequest } from '../common';

export const enrichProfile = createAction({
  auth: dataforb2bAuth,
  name: 'enrich_profile',
  displayName: 'Enrich Profile',
  description: 'Retrieve detailed professional data, work/personal email and phone for a person.',
  props: {
    profileIdentifier: Property.ShortText({
      displayName: 'Profile Identifier',
      description: 'LinkedIn URL, public ID, or encoded ID',
      required: true,
    }),
    includeProfile: Property.Checkbox({
      displayName: 'Enrich Profile',
      description: 'Retrieve full profile data',
      required: false,
      defaultValue: true,
    }),
    enrichWorkEmail: Property.Checkbox({
      displayName: 'Enrich Work Email',
      description: 'Retrieve professional email',
      required: false,
      defaultValue: false,
    }),
    enrichPersonalEmail: Property.Checkbox({
      displayName: 'Enrich Personal Email',
      description: 'Retrieve personal email',
      required: false,
      defaultValue: false,
    }),
    enrichPhone: Property.Checkbox({
      displayName: 'Enrich Phone',
      description: 'Retrieve phone number',
      required: false,
      defaultValue: false,
    }),
    enrichGithub: Property.Checkbox({
      displayName: 'Enrich GitHub',
      description: 'Retrieve GitHub profile and repositories',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      profileIdentifier,
      includeProfile,
      enrichWorkEmail,
      enrichPersonalEmail,
      enrichPhone,
      enrichGithub,
    } = context.propsValue;

    const flags = {
      enrich_profile: includeProfile ?? false,
      enrich_work_email: enrichWorkEmail ?? false,
      enrich_personal_email: enrichPersonalEmail ?? false,
      enrich_phone: enrichPhone ?? false,
      enrich_github: enrichGithub ?? false,
    };
    // The API requires at least one enrich_* flag — default to full profile.
    if (!Object.values(flags).some(Boolean)) {
      flags.enrich_profile = true;
    }

    return dataForB2BRequest(context.auth.secret_text, '/enrich/profile', {
      profile_identifier: profileIdentifier,
      ...flags,
    });
  },
});
