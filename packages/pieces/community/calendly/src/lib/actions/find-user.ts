import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { findUserOutputSchema } from '../output-schemas';

export const findUserAction = createAction({
  auth: calendlyAuth,
  name: 'find_user',
  classification: 'SEARCH',
  displayName: 'Find User',
  description: "Finds a user in your Calendly organization by email.",
  audience: 'both',
  aiMetadata: {
    description:
      "Find a member of the connected user's Calendly organization by exact email. Returns found=false when nobody matches, otherwise the user (URI, name, email, scheduling URL, timezone) and their role. Read-only.",
    idempotent: true,
  },
  outputSchema: findUserOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const organization = await calendlyCommon.resolveOrganizationUri({
      token: auth.secret_text,
      organization: undefined,
    });
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<MembershipRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/organization_memberships',
      queryParams: { organization, email: propsValue.email.trim(), count: '1' },
    });
    const membership = response.collection[0];
    if (!membership) {
      return { found: false, user: null, role: null, membership_uri: null };
    }
    return {
      found: true,
      user: membership.user,
      role: membership.role,
      membership_uri: membership.uri,
    };
  },
});

type MembershipRecord = {
  uri: string;
  role: string;
  user: CalendlyRecord;
};
