import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { organizationMembershipOutputSchema } from '../output-schemas';

export const getOrganizationMembershipAction = createAction({
  auth: calendlyAuth,
  name: 'get_organization_membership',
  classification: 'READ',
  displayName: 'Get Organization Membership',
  description: 'Gets one organization membership.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Get one Calendly organization membership by its URI or UUID (from List Organization Members): the member's role and user profile. Read-only.",
    idempotent: true,
  },
  outputSchema: organizationMembershipOutputSchema,
  props: {
    membership: Property.ShortText({
      displayName: 'Membership',
      description: 'Organization membership URI or UUID.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/organization_memberships/${calendlyCommon.toUuid({ value: propsValue.membership })}`,
    });
    return response.resource;
  },
});
